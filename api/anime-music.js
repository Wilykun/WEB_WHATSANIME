// GET /api/anime-music?anime=<slug> — daftar OST/OP/ED satu anime
const { fetchAnimeSongs } = require('./_lib.js');

module.exports = async (req, res) => {
  try {
    const slug = req.query.anime || 'naruto';
    const result = await fetchAnimeSongs(slug);
    if (!result) return res.status(404).json({ error: 'Anime not found' });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch anime music' });
  }
};
