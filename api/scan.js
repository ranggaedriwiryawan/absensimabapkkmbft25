// api/scan.js
import { loadRows, mapRowStrict } from "./_sheets.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, message: "QR Code belum dikirim." });

    const { rows } = await loadRows();
    const data = rows.map(mapRowStrict);
    const mhs = data.find(m => m.qr_code === String(code).trim());
    if (!mhs) return res.status(404).json({ ok: false, message: "Data mahasiswa tidak ditemukan untuk QR tersebut." });

    res.status(200).json({ ok: true, data: mhs });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
