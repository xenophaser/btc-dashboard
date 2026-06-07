# BTC Signal Dashboard

Live BTC/USD signal dashboard pulling real data from Phemex public API.

**Indicators:** RSI (14) · Bollinger Bands (20,2) · MACD (12,26,9) · Volume · Day-of-week bias

**Contract:** BTC/USD Inverse Perpetual · Daily timeframe

**Auto-refreshes** every 60 seconds.

---

## Deploy in 5 minutes

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "init btc dashboard"
gh repo create btc-dashboard --public --push
```

Or manually create a repo on github.com and push.

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `btc-dashboard` repo
4. Framework preset: **Vite**
5. Click **Deploy**

Done — you'll get a URL like `btc-dashboard-xxx.vercel.app`.

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Notes

- No API key needed — uses Phemex public endpoints
- Data: `api.phemex.com/md/kline` and `/md/ticker/24hr`
- Not financial advice
