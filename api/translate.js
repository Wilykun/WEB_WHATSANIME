// POST /api/translate — terjemahan sinopsis EN -> ID via MyMemory
const { fetchWithTimeout } = require('./_lib.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Text required' });
    const clean = String(text).replace(/<[^>]*>/g, '').substring(0, 500);
    const encoded = encodeURIComponent(clean);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|id`;
    const response = await fetchWithTimeout(url, {}, 10000);
    const data = await response.json();
    if (data.responseStatus === 200) {
      return res.json({ translated: data.responseData.translatedText });
    }
    return res.status(500).json({ error: 'Translation failed' });
  } catch (e) {
    return res.status(500).json({ error: 'Translation error' });
  }
};
