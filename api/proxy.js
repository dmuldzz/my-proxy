export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  const targetUrl = req.query.url;
 
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter. Usage: /api/proxy?url=https://example.com' });
  }
 
  const allowedDomains = [
    'api-web.nhle.com',
    'api.nhle.com',
    'suggest.svc.nhl.com',
    'records.nhl.com',
    'stats.nhl.com',
    'api.coingecko.com',
    'finnhub.io',
    'api.alternative.me',
    'api.mysportsfeeds.com',
    'www.reddit.com',
    'reddit.com',
    'api.rss2json.com',
  ];
 
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }
 
  const hostname = parsedUrl.hostname;
  const isAllowed = allowedDomains.some(d => hostname === d || hostname.endsWith('.' + d));
 
  if (!isAllowed) {
    return res.status(403).json({ error: `Domain not allowed: ${hostname}`, allowedDomains });
  }
 
  try {
    const headers = { 'Accept': 'application/json', 'User-Agent': 'HockeyTerminal/3.0' };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
 
    const response = await fetch(targetUrl, { headers });
 
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Upstream request failed',
        status: response.status,
        url: targetUrl
      });
    }
 
    const contentType = response.headers.get('content-type') || 'application/json';
    const data = await response.text();
 
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).send(data);
 
  } catch (error) {
    return res.status(500).json({
      error: 'Proxy fetch failed',
      message: error.message,
      url: targetUrl
    });
  }
}
