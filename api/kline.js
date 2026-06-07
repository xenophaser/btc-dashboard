export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const r = await fetch('https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1d&limit=65')
    const rows = await r.json()
    const data = rows.map(k => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
    res.status(200).json({ data: { rows: data } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
