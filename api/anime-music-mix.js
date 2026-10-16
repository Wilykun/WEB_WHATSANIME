// GET /api/anime-music-mix — campuran acak lagu dari banyak anime
// (versi Vercel: 20 anime agar selesai < 10 detik di paket gratis)
const { fetchAnimeSongs } = require('./_lib.js');

const MIX_SLUGS = [
  'naruto', 'one_piece', 'bleach', 'kimetsu_no_yaiba',
  'shingeki_no_kyojin', 'jujutsu_kaisen', 'dragon_ball_z',
  'sword_art_online', 'tokyo_ghoul', 'oshi_no_ko',
  'chainsaw_man', 'boku_no_hero_academia', 'spy_x_family',
  'bocchi_the_rock', 'blue_lock', 'ore_dake_level_up_na_ken',
  'dandadan', 'sousou_no_frieren', 'dr_stone', 'hunter_x_hunter'
];

module.exports = async (req, res) => {
  try {
    const results = await Promise.allSettled(MIX_SLUGS.map(s => fetchAnimeSongs(s)));
    let allSongs = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value && r.value.songs) {
        allSongs = allSongs.concat(r.value.songs.slice(0, 5));
      }
    }
    for (let i = allSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
    }
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.json({ animeName: '🎲 Mix Semua Anime', songs: allSongs });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch mix' });
  }
};
