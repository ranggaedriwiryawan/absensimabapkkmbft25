// api/mahasiswa-qr.js
import { loadRows, mapRowStrict } from "./_sheets.js";

export default async function handler(req, res) {
  try {
    const { kode } = req.query; // /api/mahasiswa-qr?kode=1;ADI
    if (!kode) return res.status(400).json({ ok: false, message: "Query param 'kode' wajib ada." });

    const { rows } = await loadRows();
    const data = rows.map(mapRowStrict);
    const mhs = data.find(m => m.qr_code === String(kode).trim());
    if (!mhs) return res.status(404).json({ ok: false, message: "Mahasiswa tidak ditemukan." });
    res.status(200).json({ ok: true, data: mhs });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
