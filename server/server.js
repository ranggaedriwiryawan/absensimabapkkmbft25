// server/server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

let mahasiswaCache = [];

/** ——— STRICT map: pakai nama header PERSIS dari .env ——— */
function mapRowStrict(row) {
  const NAMA   = process.env.NAMA_COL;
  const PRODI  = process.env.PRODI_COL;
  const ALAMAT = process.env.ALAMAT_COL;
  const TGL    = process.env.TANGGAL_LAHIR_COL;
  const HOBI   = process.env.HOBI_COL;
  const MOTTO  = process.env.MOTTO_COL;
  const RIWAYAT= process.env.RIWAYAT_COL;
  const QR     = process.env.QR_COL;

  if (!NAMA || !QR) {
    throw new Error("Env NAMA_COL dan QR_COL wajib di-set agar 100% match header.");
  }

  return {
    nama: String(row.get(NAMA) ?? "").trim(),
    prodi: PRODI ? String(row.get(PRODI) ?? "").trim() : "",
    alamat: ALAMAT ? String(row.get(ALAMAT) ?? "").trim() : "",
    tanggal_lahir: TGL ? String(row.get(TGL) ?? "").trim() : "",
    hobi: HOBI ? String(row.get(HOBI) ?? "").trim() : "",
    motto: MOTTO ? String(row.get(MOTTO) ?? "").trim() : "",
    riwayat: RIWAYAT ? String(row.get(RIWAYAT) ?? "").trim() : "",
    qr_code: String(row.get(QR) ?? "").trim(),
  };
}

async function loadFromGoogleSheets() {
  const SHEET_ID  = process.env.SHEET_ID;
  const SVC_EMAIL = process.env.GOOGLE_SERVICE_EMAIL;
  let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
  const SHEET_GID = Number(process.env.GOOGLE_SHEET_GID || 0);

  if (!SHEET_ID || !SVC_EMAIL || !PRIVATE_KEY) {
    throw new Error("Env SHEET_ID/GOOGLE_SERVICE_EMAIL/GOOGLE_PRIVATE_KEY belum di-set.");
  }
  // ubah \n → newline asli (penting untuk hosting)
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");

  const { GoogleSpreadsheet } = await import("google-spreadsheet");
  const { JWT } = await import("google-auth-library");

  const jwt = new JWT({
    email: SVC_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
  await doc.loadInfo();

  // pilih sheet by GID (kalau tidak ada, fallback ke index 0)
  let sheet = doc.sheetsByIndex[0];
  for (const sh of doc.sheetsByIndex) {
    if (Number(sh.sheetId) === SHEET_GID) { sheet = sh; break; }
  }

  await sheet.loadHeaderRow();
  console.log("[Sheet Title]:", sheet.title);
  console.log("[Header Values]:", sheet.headerValues);

  const rows = await sheet.getRows();
  const list = rows.map(mapRowStrict).filter(x => x.nama && x.qr_code);

  if (!list.length) {
    throw new Error("Sheet terbaca tapi kosong/kolom tidak match dengan .env. Cek header & env.");
  }
  return list;
}

async function hydrateMahasiswa() {
  try {
    mahasiswaCache = await loadFromGoogleSheets();
    console.log(`[OK] Loaded ${mahasiswaCache.length} baris dari Google Sheets`);
  } catch (e) {
    console.error("[ERR] Gagal load Google Sheets:", e.message);
    mahasiswaCache = [];
  }
}

// Inisialisasi saat start
await hydrateMahasiswa();

/** ——— API ——— */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, count: mahasiswaCache.length });
});

app.get("/api/mahasiswa", (req, res) => {
  if (!mahasiswaCache.length) {
    return res.status(503).json({
      ok: false,
      message: "Data mahasiswa tidak ditemukan. Cek kredensial, share akses sheet, & .env header.",
    });
  }
  res.json({ ok: true, data: mahasiswaCache });
});

// Cari by QR via path param (tanpa body)
app.get("/api/mahasiswa/qr/:kode", (req, res) => {
  const kode = String(req.params.kode || "").trim();
  const mhs = mahasiswaCache.find(m => m.qr_code === kode);
  if (!mhs) return res.status(404).json({ ok: false, message: "Mahasiswa tidak ditemukan untuk QR tsb." });
  res.json({ ok: true, data: mhs });
});

// Cari by QR via body { code: "<qr>" }
app.post("/api/scan", (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ ok: false, message: "QR Code belum dikirim." });

  const mhs = mahasiswaCache.find(m => m.qr_code === String(code).trim());
  if (!mhs) {
    return res.status(404).json({ ok: false, message: "Data mahasiswa tidak ditemukan untuk QR tersebut." });
  }

  // (opsional) validasi tambahan: pastikan NAMA di QR = NAMA di sheet
  // jika format QR kamu "NOMOR;NAMA", kamu bisa split dan cek nama di sini

  res.json({ ok: true, data: mhs });
});

// (opsional) manual reload data tanpa restart server
app.post("/api/reload", async (req, res) => {
  try {
    await hydrateMahasiswa();
    res.json({ ok: true, count: mahasiswaCache.length, message: "Data direfresh dari Google Sheets." });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server QR Absensi running at http://localhost:${PORT}`);
});
