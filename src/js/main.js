document.addEventListener('DOMContentLoaded', () => {
    // GANTI DENGAN URL WEB APP ANDA DARI GOOGLE APPS SCRIPT
    const SCRIPT_URL = 'https://docs.google.com/spreadsheets/d/12BM3wF2l7eBpy91hjhzJQEGZMSfSElyzvEgR_mPkDHY/edit?usp=sharing'; 

    const companionNameEl = document.getElementById('companion-name');
    const logoutButton = document.getElementById('logout-button');
    const notificationArea = document.getElementById('notification-area');
    let lastScannedNIM = null;
    let notificationTimeout;

    // 1. Inisialisasi & Cek Login
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'login.html'; // Tendang jika belum login
        return;
    }
    companionNameEl.textContent = loggedInUser;

    // 2. Inisialisasi QR Scanner
    const html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Hentikan pemindaian agar tidak memindai berulang kali
        html5QrCode.stop().then(() => {
            console.log("QR Code scanning is stopped.");
            handleScanSuccess(decodedText);
        }).catch(err => console.error("Failed to stop QR Code scanning.", err));
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => console.error("Unable to start scanning.", err));

    // 3. Fungsi utama saat scan berhasil
    async function handleScanSuccess(qrData) {
        const companion = localStorage.getItem('loggedInUser');
        showNotification('loading', 'Memproses data...');

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ qrData: qrData, companion: companion }),
                redirect: 'follow'
            });

            const result = await response.json();
            
            // Logika tampilan notifikasi
            if (result.status === 'success') {
                lastScannedNIM = result.nim; // Simpan NIM untuk kemungkinan pembatalan
                const message = `✅ Berhasil! Nama: <strong>${result.nama}</strong>, NIM: <strong>${result.nim}</strong>, Status: Kehadiran Dicatat.`;
                showNotification('success', message, true);
            } else if (result.status === 'duplicate') {
                const message = `⚠️ Perhatian! <strong>${result.nama}</strong> (${result.nim}) sudah melakukan absensi sebelumnya.`;
                showNotification('warning', message);
            } else if (result.status === 'not_found') {
                const message = `❌ Gagal! QR Code tidak valid atau tidak terdaftar.`;
                showNotification('error', message);
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            showNotification('error', 'Terjadi kesalahan saat menghubungi server.');
        } finally {
            // Mulai ulang pemindaian setelah beberapa saat
            setTimeout(() => {
                html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
                    .catch(err => console.error("Unable to restart scanning.", err));
            }, 3000); // Tunggu 3 detik sebelum memulai lagi
        }
    }

    // 4. Fungsi untuk menampilkan notifikasi
    function showNotification(type, message, showCancelButton = false) {
        clearTimeout(notificationTimeout); // Hapus timeout sebelumnya
        notificationArea.innerHTML = ''; // Bersihkan notifikasi lama

        const notifCard = document.createElement('div');
        let bgColor, textColor;

        switch (type) {
            case 'success':
                bgColor = 'bg-success-green/10';
                textColor = 'text-success-green';
                break;
            case 'warning':
                bgColor = 'bg-warning-yellow/10';
                textColor = 'text-yellow-700';
                break;
            case 'error':
                bgColor = 'bg-error-red/10';
                textColor = 'text-error-red';
                break;
            default:
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-800';
        }

        notifCard.className = `p-4 rounded-lg shadow-md transition-all duration-300 ${bgColor} ${textColor}`;
        notifCard.innerHTML = `<p>${message}</p>`;

        if (showCancelButton) {
            const cancelButton = document.createElement('button');
            cancelButton.id = 'cancel-btn';
            cancelButton.className = 'mt-3 w-full px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 transition';
            cancelButton.textContent = 'Batalkan Absen';
            cancelButton.onclick = () => cancelAttendance(lastScannedNIM);
            notifCard.appendChild(cancelButton);
        }
        
        notificationArea.appendChild(notifCard);

        // Sembunyikan notifikasi setelah 7 detik jika bukan loading
        if (type !== 'loading') {
            notificationTimeout = setTimeout(() => {
                notifCard.style.opacity = '0';
                setTimeout(() => notificationArea.innerHTML = '', 500);
            }, 7000);
        }
    }

    // 5. Fungsi untuk membatalkan absensi
    async function cancelAttendance(nim) {
        if (!nim) return;
        showNotification('loading', 'Membatalkan absensi...');

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nim: nim, action: 'cancel' }),
                redirect: 'follow'
            });

            const result = await response.json();
            if (result.status === 'cancelled') {
                showNotification('success', `Absensi untuk NIM <strong>${nim}</strong> berhasil dibatalkan.`);
            } else {
                showNotification('error', `Gagal membatalkan absensi untuk NIM <strong>${nim}</strong>.`);
            }

        } catch (error) {
            console.error("Cancel Fetch Error:", error);
            showNotification('error', 'Gagal menghubungi server untuk pembatalan.');
        }
    }

    // 6. Fungsi Logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    });
});