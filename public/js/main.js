// Kunci untuk menyimpan data di Local Storage
const ATTENDANCE_STORAGE_KEY = 'attendanceData';
const USER_ROLE_KEY = 'userRole';

/**
 * Mengambil data mahasiswa dari API backend.
 * Fungsi ini dijalankan sekali saat aplikasi dimuat.
 */
async function fetchAndInitializeData() {
    try {
        const response = await fetch('/api/mahasiswa');
        if (!response.ok) throw new Error('Gagal mengambil data dari server');
        
        const mahasiswaData = await response.json();
        
        // Inisialisasi data absensi di Local Storage jika belum ada
        if (!localStorage.getItem(ATTENDANCE_STORAGE_KEY)) {
            const initialAttendance = mahasiswaData.map(mhs => ({ ...mhs, status_hadir: false }));
            localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(initialAttendance));
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Tidak dapat memuat data mahasiswa. Pastikan server berjalan.");
    }
}

/**
 * Menampilkan notifikasi sementara di layar.
 */
function showNotification(message, isSuccess) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
        notification.classList.add(isSuccess ? 'bg-green-500' : 'bg-red-500');
        setTimeout(() => notification.classList.add('hidden'), 3000);
    }
}

/**
 * Cek otentikasi pengguna untuk melindungi halaman.
 */
function checkAuth(allowedRoles) {
    const userRole = localStorage.getItem(USER_ROLE_KEY);
    if (!userRole || !allowedRoles.includes(userRole)) {
        window.location.href = '/index.html';
    }
}

/**
 * Fungsi untuk logout.
 */
function handleLogout() {
    localStorage.removeItem(USER_ROLE_KEY);
    // Kita tidak menghapus data absensi agar admin masih bisa melihatnya
    window.location.href = '/index.html';
}

/**
 * Logika untuk Halaman Login.
 */
function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');

        if (email === 'pendamping@unwiku.ac.id' && password === 'panitia2024') {
            localStorage.setItem(USER_ROLE_KEY, 'pendamping');
            window.location.href = '/scanner.html';
        } else if (email === 'admin@unwiku.ac.id' && password === 'adminjaya') {
            localStorage.setItem(USER_ROLE_KEY, 'admin');
            window.location.href = '/dashboard.html';
        } else {
            errorDiv.textContent = 'Email atau password salah!';
            errorDiv.classList.remove('hidden');
        }
    });
}

/**
 * Logika untuk Halaman Scanner.
 */
function setupScannerPage() {
    checkAuth(['pendamping', 'admin']);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    const html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        handleScan(decodedText);
        html5QrCode.pause(true);
        setTimeout(() => html5QrCode.resume(), 3000);
    };
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
        .catch(err => {
            console.error("Gagal memulai scanner:", err);
            showNotification("ERROR: Tidak dapat mengakses kamera.", false);
        });
}

/**
 * Memproses hasil scan QR Code.
 */
function handleScan(qrKey) {
    let attendanceData = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY));
    // Mencari mahasiswa berdasarkan kolom 'QR CODE'
    const mhsIndex = attendanceData.findIndex(m => m['QR CODE'] && m['QR CODE'].trim() === qrKey.trim());

    if (mhsIndex !== -1) {
        if (attendanceData[mhsIndex].status_hadir) {
            showNotification(`⚠️ Gagal: ${attendanceData[mhsIndex]['NAMA (WAJIB DIKETIK KAPITAL SEMUA)']} sudah absen.`, false);
        } else {
            attendanceData[mhsIndex].status_hadir = true;
            localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendanceData));
            showNotification(`✅ Berhasil: ${attendanceData[mhsIndex]['NAMA (WAJIB DIKETIK KAPITAL SEMUA)']} telah diabsen.`, true);
        }
    } else {
        showNotification('❌ Gagal: QR Code tidak valid atau tidak ditemukan.', false);
    }
}

/**
 * Logika untuk Halaman Dashboard.
 */
function setupDashboardPage() {
    checkAuth(['admin']);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    const attendanceData = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY)) || [];
    
    // Hitung statistik
    const totalMahasiswa = attendanceData.length;
    const totalHadir = attendanceData.filter(m => m.status_hadir).length;
    const persentase = totalMahasiswa > 0 ? ((totalHadir / totalMahasiswa) * 100).toFixed(1) : 0;

    document.getElementById('total-hadir').textContent = totalHadir;
    document.getElementById('total-mahasiswa').textContent = totalMahasiswa;
    document.getElementById('persentase-kehadiran').textContent = `${persentase}%`;

    // Tampilkan data yang belum hadir
    const tabelBelumHadir = document.getElementById('tabel-belum-hadir').getElementsByTagName('tbody')[0];
    tabelBelumHadir.innerHTML = ''; // Kosongkan tabel
    const belumHadir = attendanceData.filter(m => !m.status_hadir);

    if (belumHadir.length === 0) {
        tabelBelumHadir.innerHTML = '<tr><td colspan="2" class="text-center p-4">Semua mahasiswa sudah hadir!</td></tr>';
    } else {
        belumHadir.forEach(m => {
            let row = tabelBelumHadir.insertRow();
            row.innerHTML = `
                <td class="border px-4 py-2">${m['NAMA (WAJIB DIKETIK KAPITAL SEMUA)']}</td>
                <td class="border px-4 py-2">${m['PROGRAM STUDI']}</td>
            `;
        });
    }

    // Fungsi Ekspor
    document.getElementById('export-btn').addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Nama Lengkap,Program Studi,Status Hadir\r\n";
        
        attendanceData.forEach(item => {
            const status = item.status_hadir ? 'Hadir' : 'Tidak Hadir';
            const row = `"${item['NAMA (WAJIB DIKETIK KAPITAL SEMUA)']}","${item['PROGRAM STUDI']}","${status}"`;
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "rekap_absensi_maba.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// --- ROUTER & INISIALISASI ---
document.addEventListener('DOMContentLoaded', async () => {
    // Muat data dari server terlebih dahulu
    await fetchAndInitializeData();

    const path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html')) {
        setupLoginPage();
    } else if (path.endsWith('/scanner.html')) {
        setupScannerPage();
    } else if (path.endsWith('/dashboard.html')) {
        setupDashboardPage();
    }
});