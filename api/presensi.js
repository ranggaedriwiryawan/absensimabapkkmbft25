// api/presensi.js
import { loadRows, mapRowStrict, getAttendanceSheet, nowJakarta } from "./_sheets.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const { code, scanner } = req.body || {};
    if (!code) return res.status(400).json({ ok: false, message: "Body { code } wajib ada." });

    // 1) validasi QR di database mahasiswa
    const { doc, rows } = await loadRows();
    const data = rows.map(mapRowStrict);
    const mhs = data.find(m => m.qr_code === String(code).trim());
    if (!mhs) return res.status(404).json({ ok: false, message: "QR tidak ditemukan di database mahasiswa." });

    // 2) pilih tab absensi
    const att = await getAttendanceSheet(doc);

    // 3) header absensi dari ENV (atau default)
    const COL_TS   = process.env.ATT_COL_TIMESTAMP || "Timestamp";
    const COL_QR   = process.env.ATT_COL_QR || "QR CODE";
    const COL_NAMA = process.env.ATT_COL_NAMA || "Nama";
    const COL_PRODI= process.env.ATT_COL_PRODI || "Prodi";
    const COL_TGL  = process.env.ATT_COL_TANGGAL || "Tanggal";
    const COL_JAM  = process.env.ATT_COL_JAM || "Jam";
    const COL_SCN  = process.env.ATT_COL_SCANNER || "Scanner";

    // 4) anti-duplikat per hari (QR sama & tanggal sama)
    const recent = await att.getRows({ offset: Math.max(0, att.rowCount - 500) });
    const { iso, tanggal, jam } = nowJakarta();
    const dup = recent.find(r =>
      String(r.get(COL_QR) ?? "").trim() === String(code).trim() &&
      String(r.get(COL_TGL) ?? "").trim() === String(tanggal).trim()
    );
    if (dup) {
      return res.status(409).json({
        ok: false,
        message: "Sudah tercatat hari ini (duplikat).",
        last: {
          timestamp: String(dup.get(COL_TS) ?? ""),
          tanggal: String(dup.get(COL_TGL) ?? ""),
          jam: String(dup.get(COL_JAM) ?? ""),
          scanner: String(dup.get(COL_SCN) ?? "")
        }
      });
    }

    // 5) tulis baris baru
    const rowObj = {
      [COL_TS]: iso,
      [COL_TGL]: tanggal,
      [COL_JAM]: jam,
      [COL_QR]: mhs.qr_code,
      [COL_NAMA]: mhs.nama,
      [COL_PRODI]: mhs.prodi,
      [COL_SCN]: scanner || "",
    };
    await att.addRow(rowObj);

    res.status(200).json({ ok: true, message: "Presensi tercatat.", data: rowObj });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
