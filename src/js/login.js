document.addEventListener('DOMContentLoaded', () => {
    // Data dummy untuk login pendamping
    const companionCredentials = [
        { user: 'andi', pass: 'pkkmb2025' },
        { user: 'dewi', pass: 'unwikuhebat' },
        { user: 'budi', pass: 'teknikjaya' },
        { user: 'citra', pass: 'pkkmboke' },
        { user: 'eko', pass: 'semangat25' },
        { user: 'fitri', pass: 'suksespkkmb' },
        { user: 'gita', pass: 'unwikukeren' },
        { user: 'hasan', pass: 'majubersama' },
        { user: 'ina', pass: 'solidaritas' },
        { user: 'joni', pass: 'ftunwiku' }
    ];

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Mencegah form dari reload halaman

        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value;

        // Cari kredensial yang cocok
        const validUser = companionCredentials.find(
            cred => cred.user === usernameInput && cred.pass === passwordInput
        );

        if (validUser) {
            // Jika valid, simpan username di localStorage dan arahkan ke halaman scanner
            localStorage.setItem('loggedInUser', validUser.user);
            window.location.href = 'index.html'; // atau './index.html'
        } else {
            // Jika tidak valid, tampilkan pesan error
            errorMessage.classList.remove('hidden');
        }
    });
});