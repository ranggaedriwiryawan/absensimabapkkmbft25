const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const port = 3000;

const results = [];

// Membaca dan mem-parsing file CSV
// Menggunakan path.join untuk memastikan lokasinya selalu benar
fs.createReadStream(path.join(__dirname, 'DATA MABA.csv'))
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
        console.log('File CSV berhasil diproses.');
    });

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Membuat API endpoint untuk data mahasiswa
app.get('/api/mahasiswa', (req, res) => {
    res.json(results);
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});