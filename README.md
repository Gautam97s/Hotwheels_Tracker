# Hot Wheels Restock Tracker

A production-quality **frontend + backend** Hot Wheels availability tracker for Indian e-commerce platforms.

## Project Structure

```
hotwheels-tracker/
├── frontend/                 # Next.js 14 Frontend (Vercel)
│   ├── src/
│   │   ├── app/              # App Router pages + API routes
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities, storage, notifications
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── tailwind.config.ts
│
├── backend/                  # Node.js/TypeScript Backend (GitHub Actions)
│   ├── src/
│   │   ├── platforms/        # Platform-specific checkers
│   │   ├── notifiers/        # Telegram notifications
│   │   ├── storage/          # JSON status persistence
│   │   ├── config.ts         # Configuration
│   │   └── index.ts          # Main entry point
│   ├── storage/              # Runtime config/status (gitignored)
│   ├── package.json
│   └── tsconfig.json
│
├── .github/
│   └── workflows/
│       └── check-stock.yml   # GitHub Actions workflow
│
└── package.json              # Root workspace config
```

## Features

### Frontend (Next.js + Vercel)
- **Dashboard** - Track multiple Hot Wheels cars
- **Add Products** - Manual entry with platform URLs
- **Price Threshold Alerts** - Notify only when price ≤ target
- **Telegram Integration** - Bot token & chat ID management
- **Real-time Config** - Stored in Vercel KV, synced with backend
- **Dark/Light Mode** - System-aware theming
- **Responsive Design** - Mobile-first Tailwind CSS

### Backend (GitHub Actions)
- **Multi-platform Checking** - Blinkit, Zepto, FirstCry, Amazon
- **Pincode-based Stock** - Location-aware availability
- **Scheduled Runs** - Every 10 minutes (configurable)
- **Telegram Notifications** - Restock & price threshold alerts
- **Status Persistence** - JSON committed to repo
- **Vercel KV Config** - Fetches config at runtime

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Vercel account (for KV & hosting)
- GitHub account (for Actions)
- Telegram Bot (for notifications)

### 2. Install Dependencies
```bash
# Root (optional - for workspace commands)
npm install

# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### 3. Configure Vercel KV
1. Vercel Dashboard → Project → **Storage** → **Create Database** → **KV**
2. Name: `hotwheels-config`
3. Copy `KV_REST_API_URL` and `KV_REST_API_TOKEN`

### 4. Configure GitHub Secrets
Go to GitHub → Settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `KV_REST_API_URL` | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Vercel KV REST API Token |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Your chat ID |

### 5. Create Telegram Bot
1. Message @BotFather → `/newbot`
2. Copy token
3. Message your bot → visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Copy `chat.id` number

### 6. Deploy Frontend to Vercel
1. Push to GitHub
2. Import in Vercel
3. Add KV integration
4. Deploy

### 7. Test Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm run check
```

### 8. Trigger GitHub Actions
- Actions tab → "Check Hot Wheels Stock" → "Run workflow"

## Development

```bash
# Frontend dev server
cd frontend && npm run dev

# Backend test run
cd backend && npm run check

# Build both
npm run build
```

## Configuration

All configuration managed via **Frontend Dashboard** (Settings tab):
- Products (name, pincode, platform URLs, target price, check interval)
- Global check interval
- Telegram bot token & chat ID
- Export/Import JSON backup

Config stored in **Vercel KV** → automatically synced to GitHub Actions backend.

## Platform Support

| Platform | Method | Pincode Support |
|----------|--------|-----------------|
| Blinkit | HTML + GraphQL | ✅ Headers/cookies |
| Zepto | HTML + REST API | ✅ City mapping |
| FirstCry | HTML + REST API | ✅ Cookies |
| Amazon | HTML scraping | ⚠️ Limited |

## Notifications

- **Restock Alert** - Out of stock → In stock transition
- **Price Threshold** - In stock AND price ≤ target price
- **Periodic Summary** - Every check (configurable)

## Cost

- **Frontend**: Free (Vercel hobby tier)
- **Backend**: Free (GitHub Actions 2000 min/month)
- **Vercel KV**: Free (100K reads/day)
- **Telegram**: Free

## License

MIT