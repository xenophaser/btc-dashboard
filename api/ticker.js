export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const r = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT')
    const t = await r.json()
    res.status(200).json({
      data: {
        last: parseFloat(t.lastPrice),
        open24h: parseFloat(t.openPrice),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
        volume24h: parseFloat(t.volume),
        change24h: parseFloat(t.priceChangePercent),
      }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
