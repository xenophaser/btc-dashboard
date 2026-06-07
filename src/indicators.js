// ── RSI ────────────────────────────────────────────────────
export function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff
    else losses += Math.abs(diff)
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2))
}

// ── Bollinger Bands ────────────────────────────────────────
export function calcBB(closes, period = 20, mult = 2) {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period
  const std = Math.sqrt(variance)
  return {
    upper: parseFloat((mean + mult * std).toFixed(2)),
    mid: parseFloat(mean.toFixed(2)),
    lower: parseFloat((mean - mult * std).toFixed(2)),
  }
}

// ── MACD ──────────────────────────────────────────────────
function ema(values, period) {
  const k = 2 / (period + 1)
  let emaVal = values[0]
  for (let i = 1; i < values.length; i++) {
    emaVal = values[i] * k + emaVal * (1 - k)
  }
  return emaVal
}

export function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return null
  const macdLine = ema(closes, fast) - ema(closes, slow)
  // approximate signal using recent closes
  const macdValues = []
  for (let i = slow; i <= closes.length; i++) {
    const slice = closes.slice(0, i)
    macdValues.push(ema(slice, fast) - ema(slice, slow))
  }
  const signalLine = ema(macdValues, signal)
  const histogram = macdLine - signalLine
  return {
    macd: parseFloat(macdLine.toFixed(2)),
    signal: parseFloat(signalLine.toFixed(2)),
    histogram: parseFloat(histogram.toFixed(2)),
  }
}

// ── Composite probability score ────────────────────────────
const DOW_BIAS = { 0: -0.6, 1: 0.8, 2: 0.5, 3: 0.3, 4: 0.1, 5: -0.2, 6: -0.4 }

export function compositeScore({ rsi, bb, macd, price, volume, avgVolume }) {
  const signals = []

  // RSI (weight 0.28)
  let rsiScore = 50
  if (rsi !== null) {
    if (rsi < 20) rsiScore = 88
    else if (rsi < 30) rsiScore = 74
    else if (rsi < 40) rsiScore = 60
    else if (rsi < 50) rsiScore = 52
    else if (rsi < 60) rsiScore = 48
    else if (rsi < 70) rsiScore = 38
    else rsiScore = 22
  }
  signals.push({ name: 'RSI', score: rsiScore, weight: 0.28 })

  // BB position (weight 0.25)
  let bbScore = 50
  let bbLabel = 'N/A'
  let bbDir = 'neutral'
  if (bb && price) {
    const pos = (price - bb.lower) / (bb.upper - bb.lower)
    if (pos < 0)        { bbScore = 84; bbLabel = 'Below lower band'; bbDir = 'bull' }
    else if (pos < 0.1) { bbScore = 75; bbLabel = 'Near lower band';  bbDir = 'bull' }
    else if (pos < 0.35){ bbScore = 60; bbLabel = 'Lower zone';       bbDir = 'bull' }
    else if (pos < 0.65){ bbScore = 50; bbLabel = 'Mid band';         bbDir = 'neutral' }
    else if (pos < 0.9) { bbScore = 38; bbLabel = 'Upper zone';       bbDir = 'bear' }
    else                { bbScore = 22; bbLabel = 'Near upper band';   bbDir = 'bear' }
  }
  signals.push({ name: 'Bollinger Bands', score: bbScore, weight: 0.25, label: bbLabel, dir: bbDir })

  // MACD (weight 0.22)
  let macdScore = 50
  let macdLabel = 'N/A'
  let macdDir = 'neutral'
  if (macd) {
    if (macd.histogram > 0 && macd.macd > 0)   { macdScore = 68; macdLabel = 'Bullish crossover'; macdDir = 'bull' }
    else if (macd.histogram > 0)                { macdScore = 58; macdLabel = 'Histogram rising';  macdDir = 'bull' }
    else if (macd.histogram < 0 && macd.macd < 0){ macdScore = 32; macdLabel = 'Bearish momentum'; macdDir = 'bear' }
    else                                        { macdScore = 42; macdLabel = 'Histogram falling'; macdDir = 'bear' }
  }
  signals.push({ name: 'MACD', score: macdScore, weight: 0.22, label: macdLabel, dir: macdDir })

  // Volume (weight 0.12)
  let volScore = 50
  let volLabel = 'Normal volume'
  let volDir = 'neutral'
  if (volume && avgVolume) {
    const ratio = volume / avgVolume
    if (ratio > 1.5) { volScore = price > (bb?.mid || price) ? 65 : 35; volLabel = `High volume (${ratio.toFixed(1)}x)`; volDir = price > (bb?.mid || price) ? 'bull' : 'bear' }
    else if (ratio < 0.7) { volScore = 50; volLabel = 'Low volume'; volDir = 'neutral' }
  }
  signals.push({ name: 'Volume', score: volScore, weight: 0.12, label: volLabel, dir: volDir })

  // Day of week (weight 0.13)
  const dow = new Date().getDay()
  const bias = DOW_BIAS[dow] ?? 0
  const dowScore = 50 + bias * 8
  const dowLabels = { 0: 'Sunday — historically weak', 1: 'Monday — strongest day', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday — slight drag', 6: 'Saturday' }
  const dowDir = bias > 0.3 ? 'bull' : bias < -0.3 ? 'bear' : 'neutral'
  signals.push({ name: 'Day-of-week bias', score: dowScore, weight: 0.13, label: dowLabels[dow], dir: dowDir })

  const composite = signals.reduce((s, sig) => s + sig.score * sig.weight, 0)
  return { composite: Math.round(composite), signals, bbLabel, bbDir, macdLabel, macdDir }
}

export const DOW_BIAS_TABLE = DOW_BIAS
