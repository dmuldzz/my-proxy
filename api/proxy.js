export default async function handler(req, res) {
  // Allow all origins so your HTML files can call this proxy
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
 
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  // Get the target URL from the query string
  const targetUrl = req.query.url;
 
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }
 
  // Only allow safe domains (NHL, Reddit, CoinGecko, Finnhub, Alternative.me, MySportsFeeds)
  const allowedDomains = [
    'api-web.nhle.com',
    'api.nhle.com',
    'suggest.svc.nhl.com',
    'records.nhl.com',
    'api.coingecko.com',
    'finnhub.io',
    'api.alternative.me',
    'api.mysportsfeeds.com',
    'api.rss2json.com',
    'www.reddit.com',
    'reddit.com',
  ];
 
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
 
  const hostname = parsedUrl.hostname;
  const isAllowed = allowedDomains.some(d => hostname === d || hostname.endsWith('.' + d));
 
  if (!isAllowed) {
    return res.status(403).json({ error: 'Domain not allowed: ' + hostname });
  }
 
  try {
    // Forward any Authorization header (needed for MySportsFeeds)
    const headers = { 'Accept': 'application/json' };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
 
    const response = await fetch(targetUrl, { headers });
 
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream error', status: response.status });
    }
 
    const contentType = response.headers.get('content-type') || 'application/json';
    const data = await response.text();
 
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).send(data);
 
  } catch (error) {
    return res.status(500).json({ error: 'Proxy fetch failed', message: error.message });
  }
}
