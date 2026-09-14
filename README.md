# Eat UNC

Eat UNC is a [Next.js](https://nextjs.org/) app for browsing UNC dining hall menus, meal periods, filters, and nutrition details.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase for menu data
- PostHog for optional analytics
- Web3Forms for the feedback form

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill in the required public keys:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

The app expects the following public environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WEB3FORMS_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_DEBUG_MENU_PAGE` (optional)

These variables are exposed to the browser by design. Only use public client-side keys here.

## Scripts

- `npm run dev` starts the local dev server
- `npm run lint` runs ESLint
- `npm run typecheck` runs TypeScript without emitting files
- `npm run build` creates a production build
- `npm run start` starts the production server
- `npm run indexnow` submits the live sitemap's URLs to IndexNow (`--dry-run` to preview)

## Search and AI indexing

Discovery is split across three files, all generated or served from this repo:

- `src/app/sitemap.ts` — the crawlable URL set, windowed to menus from seven days back to
  fourteen days ahead so the crawl budget is not spent on January.
- `src/app/robots.ts` — names the AI assistants' crawlers explicitly alongside the wildcard.
- `public/llms.txt` — the plain-language brief an assistant reads instead of guessing from markup.

**IndexNow** pushes on top of that pull. A sitemap waits for a crawler to come back; IndexNow
tells the engine a URL changed, and one submission reaches every participating engine (Bing,
Yandex, Seznam, Naver — not Google, which does not participate). It matters here because Bing's
index is what Copilot and ChatGPT search read: how fast Bing sees today's menu decides whether an
assistant asked "what's for dinner at Chase" quotes today's page or last Tuesday's.

Submission is manual, and deliberately so: run `npm run indexnow`, or trigger
`.github/workflows/indexnow.yml` from the Actions tab. It is worth doing after a deploy that adds
or reshapes pages — a new route, a change to the sitemap's window. The daily menu churn
underneath the existing URLs needs no announcing, because `/chase/2026-09-14` is a URL the
engines already hold and re-crawl on their own.

Ownership is proved by a key file at the site root: `public/<key>.txt`, containing exactly the
key and nothing else. The key is public by design — it authorises submitting *your own* URLs for
crawling, nothing more — so it is checked in, and the script finds it by shape rather than by a
hardcoded name. **To rotate it**, drop in a new `public/<key>.txt`, delete the old one, and
deploy; nothing in the script or the workflow needs editing. The file must be live at
`https://eatunc.com/<key>.txt` before the first submission verifies.

## Project structure

- `src/app` contains routes, metadata, and page-level loading or error states
- `src/components` contains the main UI surfaces, including the menu experience
- `src/lib` contains Supabase setup, API helpers, shared types, and utilities
- `src/providers` contains app-level providers such as PostHog
- `public` contains static assets, `llms.txt`, and the IndexNow key file
- `scripts` contains standalone maintenance scripts run from CI, not from the app

## Open-source notes

- This project is an unofficial app and is not affiliated with or endorsed by the University of North Carolina at Chapel Hill.
- Review the branding and image assets in [`public`](/Users/ayushsagar/Documents/GitHub/unc-dining-page/public) before publishing broadly. Some names, logos, or campus imagery may be subject to third-party trademark or usage restrictions.
- A license has not been added yet. Choose and add one before publishing the repository as open source.

## Contributing

See [CONTRIBUTING.md](/Users/ayushsagar/Documents/GitHub/unc-dining-page/CONTRIBUTING.md).

## Security

See [SECURITY.md](/Users/ayushsagar/Documents/GitHub/unc-dining-page/SECURITY.md).
