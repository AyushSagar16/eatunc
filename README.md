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

## Project structure

- `src/app` contains routes, metadata, and page-level loading or error states
- `src/components` contains the main UI surfaces, including the menu experience
- `src/lib` contains Supabase setup, API helpers, shared types, and utilities
- `src/providers` contains app-level providers such as PostHog
- `public` contains static assets

## Open-source notes

- This project is an unofficial app and is not affiliated with or endorsed by the University of North Carolina at Chapel Hill.
- Review the branding and image assets in [`public`](/Users/ayushsagar/Documents/GitHub/unc-dining-page/public) before publishing broadly. Some names, logos, or campus imagery may be subject to third-party trademark or usage restrictions.
- A license has not been added yet. Choose and add one before publishing the repository as open source.

## Contributing

See [CONTRIBUTING.md](/Users/ayushsagar/Documents/GitHub/unc-dining-page/CONTRIBUTING.md).

## Security

See [SECURITY.md](/Users/ayushsagar/Documents/GitHub/unc-dining-page/SECURITY.md).
