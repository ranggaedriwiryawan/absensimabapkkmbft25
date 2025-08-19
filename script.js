let currentPendamping = null;
const webAppUrl = "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE"; // Ganti dengan URL Apps Script Web App

function login() {
  const username = document.getElementById("username").value.trim().toUpperCase();
  const password = document.getElementById("password").value.trim();

  fetch(`${webAppUrl}?action=login&username=${username}&password=${password}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentPendamping = username;
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("scannerPage").classList.remove("hidden");
        startScanner();
      } else {
        const msg = document.getElementById("loginMsg");
        msg.innerText = "❌ Username / Password salah";
        msg.classList.remove("hidden");
      }
    });
}

function startScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {
      processScan(qrCodeMessage, html5QrCode);
    },
    errorMessage => {}
  );
}

function processScan(qrText, scanner) {
  fetch(`${webAppUrl}?action=scan&pendamping=${currentPendamping}&data=${encodeURIComponent(qrText)}`)
    .then(res => res.json())
    .then(data => {
      const msg = document.getElementById("resultMsg");
      if (data.success) {
        msg.innerText = `✅ ${data.message}`;
        msg.classList.remove("text-red-500");
        msg.classList.add("text-green-600");
      } else {
        msg.innerText = `❌ ${data.message}`;
        msg.classList.remove("text-green-600");
        msg.classList.add("text-red-500");
      }
      scanner.stop();
      setTimeout(() => startScanner(), 2000);
    });
}

function logout() {
  currentPendamping = null;
  document.getElementById("scannerPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}
