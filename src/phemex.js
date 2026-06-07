export async function fetchCandles(limit = 60) {
  const res = await fetch('/api/kline')
  if (!res.ok) throw new Error(`Kline error: ${res.status}`)
  const json = await res.json()
  const rows = json?.data?.rows
  if (!rows || rows.length === 0) throw new Error('No candle data returned')
  return rows
}

export async function fetchTicker() {
  const res = await fetch('/api/ticker')
  if (!res.ok) throw new Error(`Ticker error: ${res.status}`)
  const json = await res.json()
  const t = json?.data
  if (!t) throw new Error('No ticker data')
  return t
}
