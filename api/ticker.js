export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { symbol = 'BTCUSD' } = req.query
  const url = `https://api.phemex.com/md/ticker/24hr?symbol=${symbol}`
  try {
    const r = await fetch(url)
    const data = await r.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
