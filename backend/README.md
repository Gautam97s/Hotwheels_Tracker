# Hot Wheels Stock Checker - Backend

Backend service that runs on GitHub Actions to check Hot Wheels availability across Indian e-commerce platforms with pincode-based stock detection.

## Features

- ✅ Checks **Blinkit, Zepto, FirstCry, Amazon India**
- ✅ **Pincode-based** stock checking (location matters!)
- ✅ Runs on **GitHub Actions** (free, 2000 min/month)
- ✅ **Telegram notifications** on restock
- ✅ **No proxy costs** - runs on Microsoft IPs
- ✅ Persists status to repo (JSON file)
- ✅ Works with your existing Next.js frontend

## Quick Setup

### 1. Create Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the **Bot Token**
4. Message your bot, then visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find your **Chat ID** in the response

### 2. Get Product URLs
Use your frontend's "Find Cars" feature to search for your car on each platform, then copy the product URLs.

### 3. Configure GitHub Secrets
Go to your repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|-------------|-------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather |
| `TELEGRAM_CHAT_ID` | Your chat ID |
| `DEFAULT_PINCODE` | Your 6-digit pincode (e.g., `110001`) |
| `PRODUCT_NAME` | Car name (e.g., `Hot Wheels Premium Fast & Furious Orange`) |
| `BLINKIT_URL` | Blinkit product URL (or leave empty) |
| `ZEPTO_URL` | Zepto product URL (or leave empty) |
| `FIRSTCRY_URL` | FirstCry product URL |
| `AMAZON_URL` | Amazon product URL (or leave empty) |

### 4. Enable Workflow
1. Go to **Actions** tab in your repo
2. Enable workflows if prompted
3. The workflow runs automatically every 10 minutes
4. Or trigger manually from Actions tab

## Local Development

```bash
cd backend

# Install dependencies
npm install

# Copy env example
cp .env.example .env
# Edit .env with your values

# Run once locally
npm run check

# Or run with ts-node directly
npx ts-node src/index.ts
```

## How It Works

```
GitHub Actions (cron: */10 * * * *)
         │
         ▼
    ┌─────────────────────────────────────┐
    │  Node.js Script                     │
    │  1. Loads config from secrets       │
    │  2. For each product:               │
    │     - Checks all 4 platforms        │
    │     - Uses pincode in headers       │
    │     - Parses HTML for stock/price   │
    │  3. Compares with previous status   │
    │  4. Sends Telegram on restock       │
    │  5. Saves status.json to repo       │
    └─────────────────────────────────────┘
         │
         ▼
   Telegram Alert 📱
```

## Platform-Specific Notes

| Platform | Method | Pincode Support |
|----------|--------|-----------------|
| **Blinkit** | HTML + GraphQL API | Via headers/cookies |
| **Zepto** | HTML + REST API | Via city code mapping |
| **FirstCry** | HTML + REST API | Via cookies |
| **Amazon** | HTML scraping | Limited (uses default) |

## Customization

### Change Check Frequency
Edit `.github/workflows/check-stock.yml`:
```yaml
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
    # - cron: '0 * * * *'  # Every hour
```

### Add More Products
Edit `src/config.ts` or GitHub Secrets to add more products to the array.

### Add More Notifiers
Create new files in `src/notifiers/` (Discord, Email, Slack, etc.)

## Status File

The `backend/storage/status.json` tracks:
- Last check time per product
- Stock history
- Consecutive out-of-stock count
- Last in-stock timestamp

## Troubleshooting

### "Blocked by CAPTCHA"
- Amazon frequently blocks. Try less frequent checks.
- Consider using a residential proxy service.

### "No URL configured"
- Add the product URL to GitHub Secrets for that platform.

### Telegram not working
- Verify bot token and chat ID
- Make sure you've started a chat with your bot
- Check GitHub Actions logs for API errors

### Workflow not running
- Check Actions tab → enable workflows
- Verify cron syntax in workflow file
- Check repository permissions for Actions

## Cost

**$0/month** - Uses GitHub Actions free tier (2000 min/month)
- 10 min interval × 4 platforms × ~30 sec = ~2 min/run
- 144 runs/day × 2 min = 288 min/day
- **Well within free tier** for personal use

## Integration with Frontend

Your Next.js frontend can:
1. Read `backend/storage/status.json` via GitHub raw URL
2. Display last check time, stock status per platform
3. Show price history from status file
4. Trigger manual checks via workflow_dispatch API

```typescript
// In your frontend
const statusUrl = 'https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/backend/storage/status.json';
const response = await fetch(statusUrl);
const status = await response.json();
```

## License

MIT