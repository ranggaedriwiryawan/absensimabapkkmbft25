const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// 1. MEMBUAT APLIKASI EXPRESS (INI BAGIAN YANG HILANG)
const app = express();
const port = 3000;

const results = [];

// Membaca dan mem-parsing file CSV
// Menggunakan path.join untuk memastikan lokasinya selalu benar
const csvFilePath = path.join(__dirname, 'DATA MABA.csv');

fs.createReadStream(csvFilePath)
    .on('error', (error) => {
        // Tambahan: Memberi tahu jika file CSV tidak ditemukan
        console.error("==========================================");
        console.error("!!! ERROR: File 'DATA MABA.csv' tidak ditemukan.");
        console.error("Pastikan file tersebut ada di folder yang sama dengan server.js");
        console.error("==========================================");
    })
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
        console.log('File CSV berhasil diproses dan data siap disajikan.');
    });

// 2. MENYAJIKAN FILE STATIS (HTML, CSS, JS) DARI FOLDER 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 3. MEMBUAT API ENDPOINT UNTUK MENGIRIM DATA MAHASISWA
// Endpoint ini yang akan diakses oleh frontend untuk mendapatkan data
app.get('/api/mahasiswa', (req, res) => {
    res.json(results);
});

// 4. MENJALANKAN SERVER
// SOLUSI: Tambahkan rute ini untuk halaman utama secara manual
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Baris di bawah ini sudah ada di kode Anda, jangan diubah
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
