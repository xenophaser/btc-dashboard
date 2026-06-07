export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_high_24h=true&include_low_24h=true')
    const d = await r.json()
    const b = d.bitcoin
    res.status(200).json({
      data: {
        last: b.usd,
        open24h: b.usd / (1 + b.usd_24h_change / 100),
        high24h: b.usd_24h_high,
        low24h: b.usd_24h_low,
        volume24h: b.usd_24h_vol,
        change24h: parseFloat(b.usd_24h_change.toFixed(2)),
      }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
