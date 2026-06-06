export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbol, range, interval } = req.query;
  if (!symbol || !range || !interval) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com',
      }
    });
    if (!r.ok) return res.status(r.status).json({ error: `Yahoo HTTP ${r.status}` });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: 'Sin datos para este símbolo' });

    const ts = result.timestamp;
    const q  = result.indicators.quote[0];
    const isDaily = interval === '1d' || interval === '1wk';

    const bars = [];
    for (let i = 0; i < ts.length; i++) {
      if (q.open[i] == null || q.close[i] == null) continue;
      const time = isDaily
        ? new Date(ts[i] * 1000).toISOString().split('T')[0]
        : ts[i];
      bars.push({ time, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i] || 0 });
    }
    res.status(200).json({ bars });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
