# Deployment Guide

This application is a 100% static React SPA (Single Page Application). It requires no backend, no database, and no server-side execution.

## Static Hosting Assumptions
- The app can be hosted on any provider that supports static files.
- The hosting provider should ideally support clean URLs or handle the base path for SPAs.

## Recommended Platforms
- **Cloudflare Pages:** Extremely fast, global CDN, and easy "Drag and Drop" or GitHub integration.
- **Netlify:** Great for static sites with simple deployment workflows.
- **Vercel:** Optimized for frontend frameworks, handles static React apps perfectly.
- **GitHub Pages:** Free and reliable for open-source projects.

## Build Command
To prepare the app for production, run:
```bash
npm run build
```
This will generate a `dist/` directory containing all necessary files (`index.html`, `assets/`, etc.).

## Environment Variables
By default, the app uses **Testnet**. If you wish to change the default behavior for your deployment:
- `VITE_BITCOIN_NETWORK`: Set to `testnet`, `mainnet`, or `regtest`. (Optional, defaults to `testnet`).

## Security Note
Since this app is client-side only, you can also run it locally for maximum privacy:
1. Clone the repo.
2. Run `npm install && npm run build`.
3. Open `dist/index.html` in a web browser, ideally on an offline machine.
