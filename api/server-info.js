// GET /api/server-info — versi Vercel (serverless): metrik mesin tidak
// relevan di lingkungan serverless. Frontend menampilkan "Tidak tersedia".
module.exports = async (req, res) => {
  return res.status(503).json({ error: 'Info server tidak tersedia di Vercel (serverless)' });
};
