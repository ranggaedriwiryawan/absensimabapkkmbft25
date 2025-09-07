// api/health.js
import { loadRows } from "./_sheets.js";

export default async function handler(req, res) {
  try {
    const { sheet, rows } = await loadRows();
    res.status(200).json({ ok: true, sheet: { title: sheet.title, gid: sheet.sheetId }, count: rows.length });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
