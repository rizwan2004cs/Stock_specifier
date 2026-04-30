# Stock Specifier

An Apple-inspired NSE/BSE portfolio advisor built for Vercel.

## Local Setup

```bash
npm.cmd install
npm.cmd run dev
```

The app runs without service keys in local mode. Add `.env.local` from `.env.example` to enable Clerk, Groq, Neon, Upstash, Vercel Blob, and Alpha Vantage.

## Production Notes

- `GROQ_API_KEY` is server-only and powers advisor responses.
- `DATABASE_URL` enables Neon persistence.
- Upstash Redis is used as a cache when configured.
- Market data uses best-effort free sources and displays freshness warnings.
