# BIOMED Molecular White — deploy bundle

This folder is a self-contained copy of the static site and optional Node server for media uploads.

## GitHub Pages (static)

1. Push this folder as the repository root (or publish the `/docs` or `gh-pages` branch from it).
2. Open the site at `/` — `index.html` redirects to `BIOMED_Molecular_White_demo.html`.
3. Keep paths relative: `site-assets/`, `banners/`, and `products-data.json` must stay alongside the HTML files.

## Local preview with admin uploads

```bash
npm install
npm start
```

Then open the URL shown in the terminal (static files + upload API). Use `admin.html` to add images.

## Files to ship

- `BIOMED_Molecular_White_demo.html` — home
- `BIOMED_Molecular_White_products.html` — product lines
- `BIOMED_Molecular_White_game.html` — game
- `admin.html` — upload UI (needs `npm start`)
- `products-data.json`, `BIOMED_price_table.tsv`
- `site-assets/`, `banners/`
- `server.js`, `package.json`, `package-lock.json` (if using the server)
