import { useState, useEffect, useCallback } from 'react'
import { fetchCandles, fetchTicker } from './phemex'
import { calcRSI, calcBB, calcMACD, compositeScore, DOW_BIAS_TABLE } from './indicators'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import './App.css'

const REFRESH_INTERVAL = 60000 // 60 seconds

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmt(n, decimals = 0) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function Badge({ dir, label }) {
  const cls = dir === 'bull' ? 'badge green' : dir === 'bear' ? 'badge red' : 'badge neutral'
  return <span className={cls}>{label}</span>
}

function SignalRow({ name, value, label, dir, score }) {
  const arrow = dir === 'bull' ? '↑' : dir === 'bear' ? '↓' : '→'
  const arrowColor = dir === 'bull' ? 'var(--green)' : dir === 'bear' ? 'var(--red)' : 'var(--muted)'
  return (
    <div className="signal-row">
      <span className="signal-arrow" style={{ color: arrowColor }}>{arrow}</span>
      <span className="signal-name">{name}</span>
      <span className="signal-val">{value}</span>
      <Badge dir={dir} label={label || '—'} />
      <span className="signal-score">{score}</span>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [chartData, setChartData] = useState([])

  const load = useCallback(async () => {
    try {
      const [candles, ticker] = await Promise.all([fetchCandles(60), fetchTicker()])
      const closes = candles.map(c => c.close)
      const volumes = candles.map(c => c.volume)
      const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20

      const rsi = calcRSI(closes, 14)
      const bb = calcBB(closes, 20, 2)
      const macd = calcMACD(closes, 12, 26, 9)
      const price = ticker.last

      const { composite, signals } = compositeScore({
        rsi, bb, macd, price,
        volume: volumes[volumes.length - 1],
        avgVolume: avgVol,
      })

      // chart: last 30 candles with close price
      const chart = candles.slice(-30).map(c => ({
        date: new Date(c.time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(c.close),
      }))

      setData({ rsi, bb, macd, price, ticker, composite, signals, candles })
      setChartData(chart)
      setLastUpdate(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [load])

  const todayDow = new Date().getDay()

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <p>Fetching live data from Phemex…</p>
    </div>
  )

  if (error) return (
    <div className="loading">
      <p style={{ color: 'var(--red)' }}>Error: {error}</p>
      <button className="btn" onClick={load} style={{ marginTop: 16 }}>Retry</button>
    </div>
  )

  const { rsi, bb, macd, price, ticker, composite, signals } = data
  const bullProb = composite
  const bearProb = 100 - composite
  const verdict = bullProb >= 65
    ? { text: 'Oversold — watch for reversal confirmation before entering long.', color: 'var(--green)', bg: 'rgba(34,197,94,0.08)' }
    : bullProb <= 40
    ? { text: 'Bearish conditions dominate. Stay out or look for short setups only.', color: 'var(--red)', bg: 'rgba(239,68,68,0.08)' }
    : { text: 'Mixed signals. No high-conviction setup — wait for clarity.', color: 'var(--amber)', bg: 'rgba(245,158,11,0.08)' }

  const changeColor = ticker.change24h >= 0 ? 'var(--green)' : 'var(--red)'

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">₿</span>
          <div>
            <h1>BTC/USD Signal Dashboard</h1>
            <p className="subtitle">Phemex Inverse Perpetual · Daily · Auto-refreshes every 60s</p>
          </div>
        </div>
        <div className="header-right">
          <button className="btn" onClick={load}>↻ Refresh</button>
          {lastUpdate && <span className="muted">{lastUpdate.toLocaleTimeString()}</span>}
        </div>
      </header>

      {/* Price strip */}
      <div className="price-strip">
        <div className="price-main">${fmt(price)}</div>
        <div style={{ color: changeColor, fontWeight: 500 }}>
          {ticker.change24h >= 0 ? '+' : ''}{ticker.change24h}% 24h
        </div>
        <div className="muted">H: ${fmt(ticker.high24h)} · L: ${fmt(ticker.low24h)}</div>
      </div>

      {/* Metric cards */}
      <div className="metric-grid">
        <div className="card">
          <p className="card-label">RSI (14)</p>
          <p className="card-value" style={{ color: rsi < 30 ? 'var(--green)' : rsi > 70 ? 'var(--red)' : 'var(--text)' }}>
            {rsi ?? '—'}
          </p>
          <p className="muted">{rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral'}</p>
        </div>
        <div className="card">
          <p className="card-label">BB Lower</p>
          <p className="card-value">${fmt(bb?.lower)}</p>
          <p className="muted">Upper ${fmt(bb?.upper)}</p>
        </div>
        <div className="card">
          <p className="card-label">MACD Histogram</p>
          <p className="card-value" style={{ color: macd?.histogram >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {macd?.histogram ?? '—'}
          </p>
          <p className="muted">Signal {macd?.signal ?? '—'}</p>
        </div>
        <div className="card">
          <p className="card-label">Bull probability</p>
          <p className="card-value" style={{ color: bullProb >= 60 ? 'var(--green)' : bullProb <= 40 ? 'var(--red)' : 'var(--amber)' }}>
            {bullProb}%
          </p>
          <p className="muted">Composite score</p>
        </div>
      </div>

      {/* Chart */}
      <div className="section-card">
        <p className="section-title">Price — last 30 days</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <XAxis dataKey="date" tick={{ fill: '#7b8098', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: '#7b8098', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} domain={['auto', 'auto']} width={48} />
              <Tooltip
                contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={v => [`$${fmt(v)}`, 'Price']}
                labelStyle={{ color: '#7b8098' }}
              />
              {bb && <ReferenceLine y={bb.upper} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" label={{ value: 'BB Upper', fill: '#7b8098', fontSize: 10 }} />}
              {bb && <ReferenceLine y={bb.mid} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" />}
              {bb && <ReferenceLine y={bb.lower} stroke="rgba(34,197,94,0.4)" strokeDasharray="4 4" label={{ value: 'BB Lower', fill: '#7b8098', fontSize: 10 }} />}
              <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Signals */}
      <div className="section-card">
        <div className="signals-header">
          <p className="section-title">Indicator signals</p>
          <span className="muted" style={{ fontSize: 11 }}>Score /100</span>
        </div>
        {signals.map(s => (
          <SignalRow
            key={s.name}
            name={s.name}
            value={
              s.name === 'RSI' ? rsi ?? '—'
              : s.name === 'MACD' ? (macd?.histogram ?? '—')
              : s.name === 'Volume' ? (s.label || '—')
              : s.label || '—'
            }
            label={s.label || '—'}
            dir={s.dir || 'neutral'}
            score={Math.round(s.score)}
          />
        ))}
      </div>

      {/* Probability bar */}
      <div className="section-card">
        <p className="section-title">Composite probability</p>
        <div className="prob-labels">
          <span style={{ color: 'var(--green)', fontWeight: 500 }}>Bull {bullProb}%</span>
          <span style={{ color: 'var(--red)', fontWeight: 500 }}>Bear {bearProb}%</span>
        </div>
        <div className="prob-track">
          <div className="prob-fill green-fill" style={{ width: `${bullProb}%` }} />
        </div>
        <div className="prob-labels" style={{ marginTop: 6 }}>
          <span className="muted">Strongly bearish</span>
          <span className="muted">Neutral</span>
          <span className="muted">Strongly bullish</span>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
          Weights: RSI 28% · Bollinger Bands 25% · MACD 22% · Volume 12% · Day-of-week 13%
        </p>
      </div>

      {/* Day of week */}
      <div className="section-card">
        <p className="section-title">Day-of-week bias</p>
        <div className="dow-grid">
          {DAYS.map((d, i) => {
            const jsDay = i
            const bias = DOW_BIAS_TABLE[jsDay] ?? 0
            const isToday = jsDay === todayDow
            const color = bias > 0 ? 'var(--green)' : 'var(--red)'
            return (
              <div key={d} className={`dow-cell ${isToday ? 'dow-today' : ''}`}>
                <div className="dow-label">{d}</div>
                <div style={{ color, fontWeight: 500, fontSize: 13 }}>
                  {bias > 0 ? '+' : ''}{bias}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Verdict */}
      <div className="verdict" style={{ background: verdict.bg, borderColor: verdict.color }}>
        <span style={{ color: verdict.color, fontWeight: 500 }}>Verdict: </span>
        <span>{verdict.text}</span>
        {bullProb >= 55 && rsi < 35 && (
          <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            Your $70K re-entry level is sound. Wait for RSI to curl above 35 and a daily close above $63K before acting.
          </p>
        )}
      </div>

      <footer className="footer">
        <p>Not financial advice. Built for educational purposes. Data: Phemex public API.</p>
      </footer>
    </div>
  )
}
