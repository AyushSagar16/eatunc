# Contributing

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the required public keys.
3. Start the app with `npm run dev`.

## Before opening a pull request

Run the project checks locally:

```bash
npm run typecheck
npm run build
```

`npm run lint` is still useful during local cleanup, but it currently reports pre-existing issues outside the scope of most changes.

## Scope

- Keep changes focused and easy to review.
- Avoid committing generated files, local editor settings, or secrets.
- Document any new environment variables in `.env.example` and `README.md`.
