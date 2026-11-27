# circadian-ui demo

The interactive demo behind [circadian.shiftbloom.studio](https://circadian.shiftbloom.studio). It imports circadian-ui from `../src`, so it always shows the code in this repository.

- `src/`: the Vite + React app (sky hero and timeline, themed notes app, four-phase strip, contrast lab, live provider readout)
- `src/sky.ts`: sunrise and sunset for the demo cities, calculated in the browser
- `worker/`: Cloudflare Worker that serves the build from static assets and adds security headers, the imprint and privacy pages and a font proxy, so visitors never contact a font CDN

## Run it

```bash
npm ci
npm run dev       # http://localhost:5173, fonts fall back to system fonts
npm run preview   # builds and runs the Worker locally with wrangler dev
```

## Deploy

```bash
npm run build
npx wrangler deploy
```

Uncomment `routes` in `wrangler.jsonc` to serve it on your own domain. The imprint and privacy pages only appear once the `LEGAL` variable is set (see the comment in `wrangler.jsonc`); until then they return 404 and their footer links are removed.
