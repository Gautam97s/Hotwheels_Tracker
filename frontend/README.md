# Hot Wheels Restock Tracker

A production-quality **frontend-only** Hot Wheels availability tracker for Indian e-commerce platforms.

## Features

- **Track specific Hot Wheels cars** across Blinkit, Zepto, FirstCry, and Amazon India
- **Add products via URL** or manual entry
- **Real-time availability checking** with configurable intervals (30s, 1m, 5m, 10m)
- **Browser notifications** when cars are restocked
- **Optional sound alerts** for restock notifications
- **Dark/Light mode** support
- **LocalStorage persistence** - all data stays in your browser
- **Mobile responsive** design
- **Deployable on Vercel** with zero backend

## Supported Platforms

- 🛒 **Blinkit** - blinkit.com
- ⚡ **Zepto** - zepto.com
- 👶 **FirstCry** - firstcry.com
- 📦 **Amazon India** - amazon.in

## Important Limitations

> **This is a frontend-only MVP.** Due to anti-bot protection, CORS restrictions, and dynamic rendering on these marketplaces, **automatic stock checking from the browser is not possible**. The tracker will:
> - Show "Unable to Check" status for all products
> - Provide direct "Open Product" links to manually verify availability
> - Remind you to check at your configured interval
> - Only work while the browser tab is open

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd hotwheels-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Push this repository to GitHub
2. Import the project in Vercel
3. Deploy - no additional configuration needed

The app will work as a static/client-heavy Next.js application with no custom server required.

## Usage

1. **Add a Car**: Click "Add Car" and paste a product URL from any supported platform
2. **Enter Details**: Since auto-extraction is blocked, you'll manually enter:
   - Car name (e.g., "Porsche 911 GT3 RS")
   - Image URL (optional)
   - Product URL
   - Platform
3. **Configure Tracking**: Set check interval and notification preferences
4. **Get Notified**: Enable browser notifications to receive alerts when cars are restocked
5. **Check Manually**: Click "Open Product" to verify availability on the marketplace

## Architecture

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── product-card.tsx
│   ├── product-grid.tsx
│   ├── add-product.tsx
│   ├── product-details.tsx
│   ├── find-cars.tsx
│   ├── dashboard-stats.tsx
│   ├── status-badge.tsx
│   ├── notification-settings.tsx
│   └── settings-panel.tsx
├── hooks/
│   └── use-product-tracker.ts
├── lib/
│   ├── storage.ts       # LocalStorage persistence
│   ├── notifications.ts # Web Notifications API
│   ├── tracker.ts       # Tracking logic
│   └── utils.ts         # Utility functions
├── services/
│   ├── index.ts         # Unified checker interface
│   ├── blinkit.ts
│   ├── zepto.ts
│   ├── firstcry.ts
│   └── amazon.ts
└── types/
    └── product.ts       # TypeScript types
```

## Future Backend Integration

The codebase is designed for easy backend integration:

- Clean `Product` and `ProductStatus` interfaces
- Isolated marketplace checkers in `services/`
- `Tracker` abstraction in `hooks/use-product-tracker.ts`
- Notification service in `lib/notifications.ts`

Future architecture:
```
Next.js Frontend → FastAPI/Node Backend → Marketplaces → Database → Notification Service → Email/Telegram/Discord/WhatsApp
```

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** inspired components
- **Lucide React** icons
- **LocalStorage** for persistence

## License

MIT License - feel free to use and modify.