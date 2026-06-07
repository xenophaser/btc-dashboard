export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=60')
    const rows = await r.json()
    const data = rows.map(k => ({
      time: Math.floor(k[0] / 1000),
      open: k[1], high: k[2], low: k[3], close: k[4], volume: 0,
    }))
    res.status(200).json({ data: { rows: data } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
