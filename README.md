# Ping Pong — Next.js version (converted)

This is a minimal Next.js project scaffold containing a simple, client-side ping-pong scoreboard converted into React components.

## What this includes
- Next.js app (pages router) with `pages/index.js`
- `components/Scoreboard.jsx` — a small interactive scoreboard that stores data in localStorage
- Global CSS in `styles/globals.css`
- `public/` folder for static assets
- Instructions to run and how to migrate your original static files into this project

## Quick start
1. Extract the zip into your project folder (or place the contents in an empty folder).
2. In Terminal, `cd` to the project folder.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:3000 in your browser.

## Migrating your existing files from the Figma Make export
- Any static images, fonts, or asset files: copy them into the `public/` folder and reference them as `/your-file.png`.
- If you have HTML snippets:
  - Copy markup into `components/` as React components (replace `class` with `className`, fix inline event handlers).
  - Import those components into `pages/index.js`.
- If you have plain JS that manipulates the DOM, migrate the logic into component state/effects or keep it as a module and call from `useEffect`.

If you'd like, I can try to migrate specific files for you — upload them and I'll convert them into components directly.
