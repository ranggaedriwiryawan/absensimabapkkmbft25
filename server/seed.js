require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { neon } = require("@neondatabase/serverless");

// Pastikan DATABASE_URL ada di file .env
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Mulai membaca file DATA MABA.csv...");
  const filePath = path.join(__dirname, "DATA MABA.csv");
  const dataToInsert = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
  // Memeriksa apakah baris memiliki data yang valid (bukan baris kosong)
  if (row['NAMA (WAJIB DIKETIK KAPITAL SEMUA)']) {
    dataToInsert.push({
      timestamp: row['Timestamp'],
      nama_lengkap: row['NAMA (WAJIB DIKETIK KAPITAL SEMUA)'],
      program_studi: row['PROGRAM STUDI'],
      alamat: row['Alamat (Ketik Kapital semua, Cukup menyebutkan nama dusun dan RT RW)'],
      tanggal_lahir: row['Tanggal lahir (Contohnya Purwokerto, 28 Oktober 2025)'],
      hobi: row['Hobi'],
      motto_hidup: row['Motto Hidup']
    });
  }
})
    .on("end", async () => {
      console.log(`Selesai membaca file CSV. Ditemukan ${dataToInsert.length} baris data.`);
      
      try {
        console.log("Memasukkan data ke database...");

        // Memasukkan semua data sekaligus
        for (const maba of dataToInsert) {
           await sql`
              INSERT INTO mahasiswa (timestamp, nama_lengkap, nim, kelompok, jurusan, nomor_telepon)
              VALUES (${maba.timestamp}, ${maba.nama_lengkap}, ${maba.nim}, ${maba.kelompok}, ${maba.jurusan}, ${maba.nomor_telepon})
            `;
        }

        console.log("✅ Sukses! Semua data berhasil dimasukkan ke database.");
      } catch (error) {
        console.error("❌ Gagal memasukkan data:", error);
      }
    });
}

main();