# Portfolio site

A portfolio site for a senior UX designer, built with Next.js (App Router),
TypeScript, and Tailwind CSS. Fully static content (no CMS, no database),
with one serverless route for the contact form, and a three-brand ×
light/dark theme switcher.

All bio, career, and case-study content in this repo is **placeholder
content** — see [Editing content](#editing-content) below to replace it.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Editing content

Nothing here requires touching component code — content lives in two places:

- **`src/content/site.ts`** — name, role, tagline, bio, résumé link, career
  timeline, skills, and social links. One typed object; edit the values.
- **`src/content/case-studies/*.mdx`** — one file per case study. Each has
  frontmatter (`title`, `client`, `role`, `year`, `summary`, `tags`, `order`,
  `featured`) followed by the case study body in Markdown. Add a new file to
  add a new case study; delete one to remove it. Set `featured: true` to
  have it show on the home page.
- **`public/resume.pdf`** — replace with a real résumé PDF.
- Case study cover art is currently a generated placeholder
  (`src/components/sections/CaseStudyCover.tsx`). Once you have real
  photography, swap it for a `next/image` per case study.

## Theme system

The site ships three brand styles — **Minimal** (clean, neutral), **Editorial**
(the refined default), and **Studio** (bolder, more creative) — each with its
own light and dark palette (six combinations total). Visitors switch both
independently from the header; the choice persists in `localStorage`.

All of it is token-driven from `src/app/globals.css`: every brand/theme
combination sets the same set of CSS custom properties (`--background`,
`--foreground`, `--accent`, `--font-display`, `--radius`, etc.), and
components consume them only through the Tailwind utilities mapped in the
`@theme inline` block (`bg-background`, `text-accent`, `font-display`,
`rounded-token`, ...). To adjust a palette or add a fourth brand, edit
`globals.css` and `src/lib/theme.ts` (the `BRANDS` list and labels) —
components don't need to change.

## Contact form

The contact form posts to `POST /api/contact`
(`src/app/api/contact/route.ts`), which validates the payload with `zod`
(`src/lib/validation.ts`) and sends the message via
[Resend](https://resend.com) (`src/lib/email.ts`).

To enable it, copy `.env.example` to `.env.local` and set:

```
RESEND_API_KEY=       # from resend.com
CONTACT_TO_EMAIL=     # where inquiries should be delivered
```

Without these set, the form still validates input client-side but returns a
clear "not configured yet" error on submit rather than failing silently.

## SEO

`src/app/sitemap.ts` and `src/app/robots.ts` generate `sitemap.xml` and
`robots.txt` from the case study list and `NEXT_PUBLIC_SITE_URL` (set this
in `.env.local` / your hosting provider before launch — it defaults to
`https://example.com`). Each page sets its own `metadata` (title/description).

## Tooling

- `npm run dev` — start the dev server
- `npm run build` — production build (statically generates every route,
  including one per case study)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check

## Deploying

Static output + one serverless route handler deploys cleanly to
[Vercel](https://vercel.com/new) with zero config — connect the repo and set
the environment variables above.
