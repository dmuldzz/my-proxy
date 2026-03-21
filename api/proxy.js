export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }
 
  const allowedDomains = [
    'api-web.nhle.com',
    'api.nhle.com',
    'suggest.svc.nhl.com',
    'records.nhl.com',
    'stats.nhl.com',
    'site.api.espn.com',
    'rss.cbssports.com',
    'sportsnaut.com',
    'api.coingecko.com',
    'finnhub.io',
    'api.alternative.me',
    'api.mysportsfeeds.com',
    'www.reddit.com',
    'reddit.com',
    'api.rss2json.com',
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com',
    'finance.yahoo.com',
    'www.tsn.ca',
    'tsn.ca',
    'www.sportsnet.ca',
    'sportsnet.ca',
    'www.nhl.com',
    'nhl.com',
    'sports.yahoo.com',
    'nhlrumors.com',
    'thehockeywriters.com',
    'www.dailyfaceoff.com',
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
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    };
 
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
 
    const response = await fetch(targetUrl, { headers, redirect: 'follow' });
 
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Upstream error',
        status: response.status,
        url: targetUrl,
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
    });
  }
}
 
