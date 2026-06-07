export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const r = await fetch('https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440')
    const json = await r.json()
    const rows = json.result.XXBTZUSD
    const data = rows.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[6]),
    }))
    res.status(200).json({ data: { rows: data } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
