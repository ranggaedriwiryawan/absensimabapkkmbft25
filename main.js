// main.js (module) — backend & frontend 1 origin (Vercel)
const API_BASE = ""; // biarkan kosong

const $ = (sel) => document.querySelector(sel);
const note = $("#notification");
const resultBox = $("#result");
const healthBox = $("#health");
const logoutBtn = $("#logout-btn");

function showNote(type, msg) {
  note.classList.remove("hidden");
  note.textContent = msg;
  note.className =
    "fixed top-5 right-5 rounded-lg px-4 py-3 text-sm font-medium shadow-2xl " +
    (type === "ok" ? "bg-emerald-600 text-white"
      : type === "warn" ? "bg-amber-600 text-white"
      : "bg-red-600 text-white");
  setTimeout(() => note.classList.add("hidden"), 3500);
}

async function pingHealth() {
  try {
    const r = await fetch(`/api/health`, { cache: "no-store" });
    const txt = await r.text();
    let j;
    try { j = JSON.parse(txt); } catch { j = { raw: txt }; }
    healthBox.textContent = JSON.stringify({ status: r.status, ...j }, null, 2);
    if (!r.ok || !j.ok || (j.count ?? 0) === 0) {
      showNote("warn", "Backend bermasalah atau data kosong. Cek /api/health detail.");
    }
  } catch (e) {
    healthBox.textContent = `Gagal cek health: ${e.message}`;
    showNote("err", "Tidak bisa menghubungi backend /api/health.");
  }
}


function renderMhs(m) {
  resultBox.innerHTML = `
    <div class="space-y-1">
      <div><span class="text-gray-400">Nama:</span> <span class="font-semibold">${m.nama || "-"}</span></div>
      <div><span class="text-gray-400">Prodi:</span> ${m.prodi || "-"}</div>
      <div><span class="text-gray-400">Alamat:</span> ${m.alamat || "-"}</div>
      <div><span class="text-gray-400">Tanggal Lahir:</span> ${m.tanggal_lahir || "-"}</div>
      <div><span class="text-gray-400">Hobi:</span> ${m.hobi || "-"}</div>
      <div><span class="text-gray-400">Motto:</span> ${m.motto || "-"}</div>
      <div><span class="text-gray-400">Riwayat:</span> ${m.riwayat || "-"}</div>
      <div><span class="text-gray-400">QR CODE:</span> <code class="text-amber-300">${m.qr_code || "-"}</code></div>
    </div>
  `;
}

let lastCode = "";
let lastAt = 0;
const DUP_WINDOW_MS = 3000;

async function handleScan(decodedText) {
  const now = Date.now();
  if (decodedText === lastCode && now - lastAt < DUP_WINDOW_MS) return;
  lastCode = decodedText; lastAt = now;

  try {
    // 1) validasi QR
    const resp = await fetch(`${API_BASE}/api/scan`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: decodedText }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      const msg = data?.message || `Gagal verifikasi QR (${resp.status})`;
      showNote("err", msg); resultBox.innerHTML = `<p class="text-red-400">${msg}</p>`; return;
    }

    renderMhs(data.data);
    showNote("ok", "QR valid. Data mahasiswa ditemukan.");

    // 2) catat presensi
    const scannerName = localStorage.getItem("scannerName") || ""; // isi saat login jika perlu
    const pres = await fetch(`${API_BASE}/api/presensi`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: decodedText, scanner: scannerName }),
    });
    const pj = await pres.json();
    if (pres.ok && pj.ok) showNote("ok", "Presensi tercatat.");
    else if (pres.status === 409) showNote("warn", pj.message || "Duplikat presensi hari ini.");
    else showNote("err", pj.message || "Gagal mencatat presensi.");
  } catch (e) {
    showNote("err", `Kesalahan jaringan: ${e.message}`);
  }
}

function initScanner() {
  const config = {
    fps: 10,
    qrbox: (vw, vh) => ({ width: Math.min(vw, vh) * 0.7, height: Math.min(vw, vh) * 0.7 }),
    rememberLastUsedCamera: true
  };
  const sc = new Html5QrcodeScanner("reader", config, false);
  sc.render((txt) => handleScan(txt), () => {});
}

logoutBtn?.addEventListener("click", () => {
  try { localStorage.removeItem("authToken"); localStorage.removeItem("scannerName"); } catch {}
  window.location.href = "./index.html";
});

initScanner();
pingHealth();
