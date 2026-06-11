<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 app (App Router, React 19, Tailwind v4), package manager is **npm**. Standard commands live in `package.json`: `npm run dev` (port 3000), `npm run build`, `npm run lint`. Dependencies are refreshed automatically on startup, so no manual install is needed.

- The app is a "Fit Video Generator": upload 4 photos → generate try-on images (stage 1) → generate a fit video (stage 2). Both stages call the external **fal.ai** API.
- The only env var the code actually reads is `FAL_KEY` (used in `lib/gemini.ts` and `lib/seedance.ts`); put it in `.env.local`. The README also mentions `GEMINI_API_KEY` but it is **not referenced anywhere in the code** — image generation runs through fal.ai, not Google directly.
- Without `FAL_KEY` the UI loads and the full client→API-route flow runs, but both generation API routes return `500 "FAL_KEY is not set"`. Real end-to-end generation needs a funded fal.ai account.
- Known pre-existing issue: `npm run lint` fails with one `react/no-unescaped-entities` error in `app/page.tsx` (apostrophe in a Ukrainian string). This is unrelated to environment setup. `npm run build` succeeds.
