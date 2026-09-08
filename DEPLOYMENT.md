# Deployment

VarshaMitra is a standard Next.js 16 App Router application with no backend,
no database, and no environment variables — it deploys anywhere Next.js
deploys.

## Deploying to Vercel (recommended)

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In Vercel, click **New Project** and import the repository.
3. Vercel auto-detects Next.js — no build command overrides are needed:
   - Build command: `next build` (default)
   - Output: managed automatically by the Next.js framework preset
   - Install command: `npm install` (default)
4. No environment variables are required for this prototype.
5. Deploy. Every route (`/`, `/login`, `/location`, `/farmer/*`,
   `/officer/*`, `/insights`, `/about`) is statically prerenderable, so first
   load is fast with no server-side data dependency.

## Local production build

```bash
npm install
npm run build
npm run start
```

`npm run build` runs the TypeScript compiler and Next.js's production build.
A clean build produces no TypeScript errors and no console warnings from any
of the 13 routes.

## Verifying before a demo

```bash
npm run lint     # zero warnings/errors expected
npm run build    # zero errors expected
npm run start    # smoke-test the production build locally
```

Then walk through `DEMO_FLOW.md` once against the production build, not just
`npm run dev`, since that's what judges will see if the app is deployed.

## Notes on the map and fonts

- The risk map's basemap tiles (`{s}.basemaps.cartocdn.com`) are fetched by
  the visitor's browser at runtime, like any web map — they are not part of
  the build and require no API key.
- All typography uses system font stacks (see `UI_UX_GUIDELINES.md`), so
  there is no external font download at build or runtime, and no font
  licensing or network dependency to manage.
