// api/mahasiswa.js
import { loadRows, mapRowStrict } from "./_sheets.js";

export default async function handler(req, res) {
  try {
    const { rows } = await loadRows();
    const data = rows.map(mapRowStrict).filter(x => x.nama && x.qr_code);
    res.status(200).json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
