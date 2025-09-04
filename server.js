app.get('/api/data', (req, res) => {
    const results = [];
    const csvFilePath = path.join(__dirname, 'DATA MABA.csv');

    fs.createReadStream(csvFilePath)
        .on('error', (error) => {
            // Jika file tidak ada atau ada masalah lain, kirim pesan error
            console.error("Gagal membaca file CSV:", error.message);
            res.status(500).json({ success: false, message: 'Server gagal memuat data.' });
        })
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.json(results);
        });
});
