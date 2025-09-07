// api/_sheets.js
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

async function openDoc() {
  const SHEET_ID  = process.env.SHEET_ID;
  const SVC_EMAIL = process.env.GOOGLE_SERVICE_EMAIL;
  let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
  if (!SHEET_ID || !SVC_EMAIL || !PRIVATE_KEY) {
    throw new Error("Missing env: SHEET_ID / GOOGLE_SERVICE_EMAIL / GOOGLE_PRIVATE_KEY");
  }
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");

  const jwt = new JWT({
    email: SVC_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"], // write access
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
  await doc.loadInfo();
  return doc;
}

/** Ambil rows dari tab data utama (GID tertentu) */
export async function loadRows() {
  const doc = await openDoc();
  const SHEET_GID = Number(process.env.GOOGLE_SHEET_GID || 0);
  let sheet = doc.sheetsByIndex[0];
  for (const sh of doc.sheetsByIndex) {
    if (Number(sh.sheetId) === SHEET_GID) { sheet = sh; break; }
  }
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();
  return { doc, sheet, rows };
}

/** Dapatkan tab Absensi dari GID atau Title (ENV) */
export async function getAttendanceSheet(doc) {
  const ATT_GID   = process.env.ATTEND_SHEET_GID ? Number(process.env.ATTEND_SHEET_GID) : null;
  const ATT_TITLE = process.env.ATTEND_SHEET_TITLE || null;

  let target = null;
  if (ATT_GID != null) {
    for (const sh of doc.sheetsByIndex) if (Number(sh.sheetId) === ATT_GID) { target = sh; break; }
  }
  if (!target && ATT_TITLE) {
    for (const sh of doc.sheetsByIndex) if (String(sh.title).trim() === String(ATT_TITLE).trim()) { target = sh; break; }
  }
  if (!target) throw new Error("Attendance sheet not found. Set ATTEND_SHEET_GID atau ATTEND_SHEET_TITLE.");

  await target.loadHeaderRow();
  return target;
}

/** Map baris data utama -> objek, sesuai header persis di ENV */
export function mapRowStrict(row) {
  return {
    nama: String(row.get(process.env.NAMA_COL) ?? "").trim(),
    prodi: String(row.get(process.env.PRODI_COL) ?? "").trim(),
    alamat: String(row.get(process.env.ALAMAT_COL) ?? "").trim(),
    tanggal_lahir: String(row.get(process.env.TANGGAL_LAHIR_COL) ?? "").trim(),
    hobi: String(row.get(process.env.HOBI_COL) ?? "").trim(),
    motto: String(row.get(process.env.MOTTO_COL) ?? "").trim(),
    riwayat: String(row.get(process.env.RIWAYAT_COL) ?? "").trim(),
    qr_code: String(row.get(process.env.QR_COL) ?? "").trim(),
  };
}

/** Timestamp WIB + komponen tanggal/jam terformat */
export function nowJakarta() {
  const tz = "Asia/Jakarta";
  const d = new Date();
  const fmt = (opts) => new Intl.DateTimeFormat("id-ID", { timeZone: tz, ...opts }).format(d);
  const tanggal = fmt({ year: "numeric", month: "2-digit", day: "2-digit" }); // dd/mm/yyyy
  const jam = fmt({ hour: "2-digit", minute: "2-digit", second: "2-digit" }); // HH.MM.SS
  const iso = new Date(d.toLocaleString("en-US", { timeZone: tz })).toISOString();
  return { iso, tanggal, jam };
}
