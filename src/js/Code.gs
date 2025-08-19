const SPREADSHEET_ID = '12BM3wF2l7eBpy91hjhzJQEGZMSfSElyzvEgR_mPkDHY';
const dbSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('QR CODE');
const logSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Log Absensi');
const dbData = dbSheet.getDataRange().getValues();

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);

    // --- Logika Pembatalan Absensi ---
    if (requestData.action === 'cancel' && requestData.nim) {
      const logData = logSheet.getDataRange().getValues();
      // Cari dari bawah ke atas untuk log terakhir yang relevan
      for (let i = logData.length - 1; i >= 0; i--) {
        // Cek NIM di kolom B (index 1) dan Status 'HADIR' di kolom E (index 4)
        if (logData[i][1] == requestData.nim && logData[i][4] === 'HADIR') {
          logSheet.getRange(i + 1, 5).setValue('DIBATALKAN'); // Update status di kolom E
          return ContentService.createTextOutput(JSON.stringify({ "status": "cancelled" })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "cancel_failed", "message": "Log kehadiran tidak ditemukan." })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- Logika Absensi Normal ---
    const qrData = requestData.qrData;
    const companion = requestData.companion;

    // Cari data mahasiswa berdasarkan QR Code di kolom C (index 2)
    const studentData = dbData.find(row => row[2] == qrData);

    if (!studentData) {
      return ContentService.createTextOutput(JSON.stringify({ "status": "not_found" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const nim = studentData[0];
    const nama = studentData[1];

    // Cek duplikasi di Log Absensi
    const logData = logSheet.getDataRange().getValues();
    const isDuplicate = logData.some(row => row[1] == nim && row[4] === 'HADIR');

    if (isDuplicate) {
      return ContentService.createTextOutput(JSON.stringify({ "status": "duplicate", "nama": nama, "nim": nim })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Jika tidak ada duplikasi, catat log baru
    const timestamp = new Date();
    logSheet.appendRow([timestamp, nim, nama, companion, 'HADIR']);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "nama": nama, "nim": nim })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}