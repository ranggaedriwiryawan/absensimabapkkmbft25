export default async function handler(req, res) {
  const keys = [
    "SHEET_ID","GOOGLE_SHEET_GID","GOOGLE_SERVICE_EMAIL","GOOGLE_PRIVATE_KEY",
    "NAMA_COL","PRODI_COL","ALAMAT_COL","TANGGAL_LAHIR_COL","HOBI_COL","MOTTO_COL","RIWAYAT_COL","QR_COL",
    "ATTEND_SHEET_GID","ATTEND_SHEET_TITLE",
    "ATT_COL_TIMESTAMP","ATT_COL_QR","ATT_COL_NAMA","ATT_COL_PRODI","ATT_COL_TANGGAL","ATT_COL_JAM","ATT_COL_SCANNER"
  ];
  const present = Object.fromEntries(keys.map(k => [k, process.env[k] ? true : false]));
  // jangan bocorkan private key; hanya panjang karakter
  const pkLen = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0;
  res.status(200).json({ ok: true, present, privateKeyLength: pkLen });
}
