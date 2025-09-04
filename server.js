// Memuat environment variables dari file .env
require("dotenv").config();

const http = require("http");
const { neon } = require("@neondatabase/serverless");

// Pastikan DATABASE_URL ada di file .env
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);

const requestHandler = async (req, res) => {
  try {
    // Menjalankan query ke database
    const result = await sql`SELECT version()`;
    const { version } = result[0];

    // Mengirim response jika berhasil
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(version);
  } catch (error) {
    // Menangani error jika koneksi atau query gagal
    console.error("Database query failed:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};

const port = process.env.PORT || 3000;
http.createServer(requestHandler).listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
