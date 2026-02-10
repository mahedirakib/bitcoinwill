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

## GitHub Pages (Important)
If you see errors like `main.tsx 404` or `logo.png 404`, GitHub Pages is likely serving the raw source `index.html` instead of the built `dist` output.

Use this setup:
1. Go to **Settings -> Pages** in your GitHub repository.
2. Set **Source** to **GitHub Actions** (not "Deploy from a branch").
3. Push to `main` and wait for the **Deploy to GitHub Pages** workflow to finish.
4. Open the Pages URL again and hard-refresh the browser cache.

## Environment Variables
By default, the app uses **Testnet**. If you wish to change the default behavior for your deployment:
- `VITE_BITCOIN_NETWORK`: Set to `testnet`, `mainnet`, or `regtest`. (Optional, defaults to `testnet`).

## Security Note
Since this app is client-side only, you can also run it locally for maximum privacy:
1. Clone the repo.
2. Run `npm install && npm run build`.
3. Open `dist/index.html` in a web browser, ideally on an offline machine.
