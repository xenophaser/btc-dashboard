const SYMBOL = 'BTCUSD'
const RESOLUTION = 86400

export async function fetchCandles(limit = 60) {
  const to = Math.floor(Date.now() / 1000)
  const from = to - RESOLUTION * (limit + 5)
  const url = `/api/kline?symbol=${SYMBOL}&resolution=${RESOLUTION}&from=${from}&to=${to}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Kline error: ${res.status}`)
  const json = await res.json()
  const rows = json?.data?.rows
  if (!rows || rows.length === 0) throw new Error('No candle data returned')
  return rows.map(r => ({
    time: r[0],
    open:   r[3] / 10000,
    high:   r[4] / 10000,
    low:    r[5] / 10000,
    close:  r[6] / 10000,
    volume: r[7],
  }))
}

export async function fetchTicker() {
  const url = `/api/ticker?symbol=${SYMBOL}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Ticker error: ${res.status}`)
  const json = await res.json()
  const t = json?.data
  if (!t) throw new Error('No ticker data')
  return {
    last:      t.lastEp   / 10000,
    open24h:   t.openEp   / 10000,
    high24h:   t.highEp   / 10000,
    low24h:    t.lowEp    / 10000,
    volume24h: t.volumeEv,
    change24h: parseFloat((((t.lastEp - t.openEp) / t.openEp) * 100).toFixed(2)),
  }
}
