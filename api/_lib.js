// Shared logic untuk Vercel serverless functions (WhatAnime Finder v1.6)

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

const ANIME_SLUGS = {
  naruto:         { name: 'Naruto', emoji: '🍃' },
  narutoshippuuden: { name: 'Naruto Shippuden', emoji: '🌀' },
  one_piece:      { name: 'One Piece', emoji: '🏴‍☠️' },
  bleach:         { name: 'Bleach', emoji: '⚔️' },
  shingeki_no_kyojin: { name: 'Attack on Titan', emoji: '💥' },
  kimetsu_no_yaiba: { name: 'Demon Slayer', emoji: '🔥' },
  jujutsu_kaisen: { name: 'Jujutsu Kaisen', emoji: '🏙️' },
  death_note:     { name: 'Death Note', emoji: '📓' },
  fullmetal_alchemist_brotherhood: { name: 'FMA Brotherhood', emoji: '⚙️' },
  dragon_ball_z:  { name: 'Dragon Ball Z', emoji: '🐉' },
  fairy_tail:     { name: 'Fairy Tail', emoji: '✨' },
  sword_art_online: { name: 'SAO', emoji: '🎮' },
  tokyo_ghoul:    { name: 'Tokyo Ghoul', emoji: '👁️' },
  black_clover_tv: { name: 'Black Clover', emoji: '🍀' },
  boruto_naruto_next_generations: { name: 'Boruto', emoji: '🌿' },
  dragon_ball_super: { name: 'Dragon Ball Super', emoji: '⭐' },
  one_punch_man:  { name: 'One Punch Man', emoji: '👊' },
  hunter_x_hunter: { name: 'Hunter x Hunter', emoji: '🎯' },
  overlord:       { name: 'Overlord', emoji: '💀' },
  tensei_shitara_slime_datta_ken: { name: 'TenSura', emoji: '🟦' },
  kono_subarashii_sekai_ni_shukufuku_wo: { name: 'KonoSuba', emoji: '💧' },
  re_zero_kara_hajimeru_isekai_seikatsu: { name: 'Re:Zero', emoji: '🔄' },
  mob_psycho_100: { name: 'Mob Psycho 100', emoji: '💫' },
  chainsaw_man:   { name: 'Chainsaw Man', emoji: '🪚' },
  vinland_saga:   { name: 'Vinland Saga', emoji: '⚓' },
  boku_no_hero_academia: { name: 'My Hero Academia', emoji: '🦸' },
  oshi_no_ko:     { name: 'Oshi no Ko', emoji: '⭐' },
  bocchi_the_rock: { name: 'Bocchi the Rock', emoji: '🎸' },
  spy_x_family:   { name: 'Spy x Family', emoji: '🕵️' },
  blue_lock:      { name: 'Blue Lock', emoji: '⚽' },
  dr_stone:       { name: 'Dr. Stone', emoji: '🧪' },
  ore_dake_level_up_na_ken: { name: 'Solo Leveling', emoji: '⬆️' },
  dandadan:       { name: 'Dandadan', emoji: '👻' },
  kaijuu_8_gou:   { name: 'Kaiju No. 8', emoji: '🦕' },
  sousou_no_frieren: { name: 'Frieren', emoji: '🧝' },
  mushoku_tensei_isekai_ittara_honki_dasu: { name: 'Mushoku Tensei', emoji: '📖' },
  mashle:         { name: 'Mashle', emoji: '🍫' },
  kusuriya_no_hitorigoto: { name: 'Apothecary Diaries', emoji: '🌸' },
  toaru_kagaku_no_railgun: { name: 'Railgun', emoji: '⚡' },
};

async function fetchAnimeSongs(slug) {
  const url = `https://api.animethemes.moe/anime/${slug}?include=animethemes.animethemeentries.videos.audio,animethemes.song.artists`;
  const response = await fetchWithTimeout(url, {
    headers: { 'User-Agent': 'WhatAnimeFinder/1.6 (anime music player)', 'Accept': 'application/json' }
  }, 9000);
  if (!response.ok) return null;
  const data = await response.json();
  const anime = data.anime;
  if (!anime) return null;
  const info = ANIME_SLUGS[slug] || {};
  const songs = [];
  for (const theme of anime.animethemes || []) {
    const entry = (theme.animethemeentries || [])[0];
    if (!entry) continue;
    const video = (entry.videos || [])[0];
    if (!video || !video.audio) continue;
    songs.push({
      id: theme.id, type: theme.type, sequence: theme.sequence, slug: theme.slug,
      title: theme.song ? theme.song.title : theme.slug,
      artist: theme.song && theme.song.artists && theme.song.artists.length
        ? theme.song.artists.map(a => a.name).join(', ') : '—',
      episodes: entry.episodes || '',
      audioUrl: video.audio.link,
      animeName: info.name || anime.name,
      animeEmoji: info.emoji || '🎵'
    });
  }
  return { animeName: info.name || anime.name, songs };
}

module.exports = { fetchWithTimeout, fetchAnimeSongs, ANIME_SLUGS };
