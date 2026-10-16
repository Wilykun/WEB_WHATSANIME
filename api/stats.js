// GET /api/stats — versi Vercel (serverless): tidak ada koneksi persisten,
// jadi counter online/kunjungan tidak didukung. Frontend menyembunyikan
// statistik footer saat menerima flag ini.
module.exports = async (req, res) => {
  return res.json({ unsupported: true, online: null, total: null });
};
