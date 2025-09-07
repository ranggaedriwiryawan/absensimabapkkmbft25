import { loadRows } from "./_sheets.js";

export default async function handler(req, res) {
  try {
    const { sheet } = await loadRows();
    await sheet.loadHeaderRow();
    res.status(200).json({ ok: true, title: sheet.title, gid: sheet.sheetId, headerValues: sheet.headerValues });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}
