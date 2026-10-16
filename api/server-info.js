// GET /api/server-info — versi Vercel (serverless)
// Metrik mesin (RAM/CPU) tidak tersedia di serverless, tapi waktu server
// selalu bisa diberikan langsung dari function (tanpa perlu database).
module.exports = async (req, res) => {
  const now = new Date();
  const fmtWIB = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const fmtDate = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short', year: 'numeric'
  });
  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    serverless: true,
    time: now.toISOString(),
    timeWIB: fmtWIB.format(now),
    dateWIB: fmtDate.format(now),
    // Patokan tetap: deployment production perdana (11:42:08 WIB, 16 Okt 2026).
    // Frontend menghitung "masa berjalan" realtime dari tanggal ini —
    // tanpa database, tanpa reset.
    launchedAt: '2026-10-16T04:42:08Z',
    region: process.env.VERCEL_REGION || 'unknown',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  });
};
