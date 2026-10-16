// POST /proxy-image — proxy gambar agar bebas CORS, dengan batas & proteksi SSRF
const dns = require('dns').promises;
const { fetchWithTimeout } = require('./_lib.js');

function isPrivateHostname(hostname) {
  const h = String(hostname).toLowerCase().replace(/\.$/, '');
  if (h === 'localhost' || h === '::1' || h === '::ffff:127.0.0.1') return true;
  if (/^127\./.test(h) || h === '0.0.0.0') return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return true;
  const m = h.match(/^172\.(\d+)\./);
  if (m && +m[1] >= 16 && +m[1] <= 31) return true;
  if (/^169\.254\./.test(h) || /^fc/i.test(h) || /^fd/i.test(h)) return true;
  return false;
}

async function isPrivateResolvedIp(hostname) {
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    return addrs.some(a => isPrivateHostname(a.address));
  } catch {
    return true;
  }
}

const PROXY_MAX_BYTES = 15 * 1024 * 1024;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    let hostname;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    if (isPrivateHostname(hostname) || await isPrivateResolvedIp(hostname)) {
      return res.status(403).json({ error: 'URL target tidak diizinkan' });
    }

    const response = await fetchWithTimeout(url, {}, 15000);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }
    const declared = parseInt(response.headers.get('content-length') || '0', 10);
    if (declared > PROXY_MAX_BYTES) {
      return res.status(413).json({ error: 'Gambar terlalu besar (maks 15 MB)' });
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > PROXY_MAX_BYTES) {
      return res.status(413).json({ error: 'Gambar terlalu besar (maks 15 MB)' });
    }
    res.setHeader('Content-Type', contentType);
    return res.send(buffer);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout mengambil gambar' });
    }
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy image' });
  }
};
