export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { symbol = 'BTCUSD', resolution = 86400, from, to } = req.query
  const url = `https://api.phemex.com/md/kline?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`
  try {
    const r = await fetch(url)
    const data = await r.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
