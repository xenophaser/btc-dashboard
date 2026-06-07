export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const r = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD')
    const json = await r.json()
    const t = json.result.XXBTZUSD
    const last = parseFloat(t.c[0])
    const open = parseFloat(t.o)
    res.status(200).json({
      data: {
        last,
        open24h: open,
        high24h: parseFloat(t.h[1]),
        low24h: parseFloat(t.l[1]),
        volume24h: parseFloat(t.v[1]),
        change24h: parseFloat(((last - open) / open * 100).toFixed(2)),
      }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
