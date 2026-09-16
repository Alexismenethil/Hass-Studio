# HASS Studio

Alexis Huamani Rivera's bilingual design studio. A cinematic public portfolio and a private workspace.

## Published preview

https://hass-studio.vercel.app — deployed to the HASS Studio project in the existing Vercel team. Supabase is connected to the live site: project `vgsywzswnxsbszrwfgwu`, with bilingual settings, three categories and three labeled design studies. The owner account has its ADMIN role activated; email delivery remains pending.

## Local development

Node 24 and pnpm 11.

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
```

The running preview currently uses http://localhost:3001/en (port 3000 was occupied). Next.js prints the port it selects. English is /en; Spanish is /es.

## What is included

- Identity motifs: Mediterranean light, the arch, the twelve-ray sun and the sea horizon, over ivory, olive and night, with a fine film grain.
- Home: a first-visit intro (the sun draws itself, an arch opens onto the hero); a WebGL hero where leaf shadows drift over the photograph and a warm light follows the pointer; the hero closes into an arch framed by the studio phrase, then the viewer passes through it into the dark. Services emerge as light burns through (WebGL dissolve between service photographs), with a 3D drum of giant titles, an arch of that service's work and chapter markers. Selected work travels sideways as a film strip; a studio note sits beside an arched photograph.
- Service pages (`/[lang]/services/[id]`) open their photograph from an arch and list every published work with curtain reveals. The work index (`/[lang]/work`) groups all work with a pointer-following preview.
- Work pages (`/[lang]/work/[slug]`): short description, optional "Visit website" link, and a scroll-driven scene — an iris of light closes on a closed laptop, the lid opens in 3D, the display wakes with a warm flash, side mirrors unfold with live reflections, dust drifts through a beam of light. Screens (photos or MP4/WebM) change with scroll; full-page captures travel inside the display, phone captures sit over a blurred copy.
- Page changes play an arch-shaped curtain carrying the destination's name. The footer is a sunset: the sun rises over the horizon with its reflection on the sea.
- Native scrolling throughout (sticky sections, short catch-up, no scroll hijacking), letter focus-pull reveals, magnetic buttons, and reduced-motion fallbacks (no intro, grain, curtain or WebGL).
- Supabase-backed bilingual content, all editable from the panel.

## Editing the website (panel)

`/admin` separates **Tu web** (public) from **Clientes** (private, never published):

- **Página de inicio** — hero image/video, big phrase, short line, and the studio statement.
- **Servicios y trabajos** — each service is one carousel slide. Open a service to edit its slide, reorder or publish/hide its works, or add a new one. A work has a title, service, year, optional link, short description, laptop screens (drag to upload several and reorder), optional thumbnail and optional case details.
- **Estudio y contacto** — biography, portrait, email, WhatsApp, socials, footer invitation.
- **Marca y SEO** — brand name, logo and search snippet.

Every editor shows a live preview and a sticky "Guardar y publicar" bar; changes are live on save. `/admin/preview` renders the panel with sample data in development.
- Admin clients, projects, archived state, progress, milestones and update timeline.
- Private attachments, email preview, explicit send confirmation, persistent statuses and guarded retries.
- Reusable creator signature in packages/branding and email template in packages/emails.

## Configure Supabase

1. Create/select your Supabase project. Apply supabase/migrations/001_studio.sql in its SQL editor or with the Supabase CLI.
2. Copy apps/web/.env.example to apps/web/.env.local. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY using the project's API settings. No service-role key is required by the app.
3. Create your user in Supabase Auth. Use its UUID for the following one-time SQL, run by the project owner:

```sql
insert into public.profiles(id, role)
values ('YOUR-AUTH-USER-UUID', 'ADMIN');
```

4. Disable public signups if no client accounts are needed. Configure your site's auth URL. Visit /admin/login and sign in with the user you created. Password recovery is managed through Supabase; no custom authentication is implemented.
5. In Mi estudio, edit your details, both languages, photographs, logo, contact links and copy. The public routes query the database; no rebuild is needed to publish content changes.

Without Supabase, the public preview loads the initial content and clearly identified design studies. No admin writes or mail sending are simulated. /admin/preview is a read-only local design preview, unavailable in production. Once Supabase is configured, database failures produce an error page, never a silent fallback to old content.

## Email delivery

Set RESEND_API_KEY and EMAIL_FROM only on the server. A verified sender domain is needed for real client delivery. Your domain is still undecided, so no real mail has been sent.

Updates are saved first. Sending claims the saved update atomically, persists an immutable email snapshot, then calls Resend using an idempotency key derived from the update UUID. Explicit provider rejections become FAILED. Ambiguous failures remain PENDING and can be retried after two minutes within a 23-hour safety window. After that, verify delivery with the provider before deciding on a new update. SENT means accepted by the provider, not confirmed inbox delivery. Files use signed links that expire after seven days.

## Files and video

Uploads go directly to Supabase Storage. Public assets use public-media; client updates use the private client-files bucket. Files larger than 6 MB use resumable upload. Limit: 50 MB per file; MP4/WebM, JPEG/PNG/WebP/AVIF, and PDF for client attachments. For best results, compress web videos before uploading and choose a useful poster/cover image.

The current laptop frame is laptop-frontal.webp; laptop-navy.png is a discarded earlier art-direction variant retained only among originals. Generated originals: assets/originals. Optimized web files: apps/web/public/images. Prompt set and generation method: docs/IMAGE-PROMPTS.md. The sample interfaces are original design studies; replace them from Portfolio and disable Concepto / estudio visual for real screenshots.

## Deployment

Import this monorepo in Vercel and choose apps/web as the root directory with Next.js detected. Add the same environment variables and the final HTTPS NEXT_PUBLIC_SITE_URL. Use pnpm install and pnpm build. Keep framework access to packages outside the application root enabled. Supabase migrations must already be applied.

The app does not use Vercel Pro-only APIs. Vercel restricts Hobby to non-commercial personal use, so the commercial launch needs an appropriate hosting plan. No paid subscriptions or purchases have been made.

## Validation and limitations

- TypeScript and production build.
- Node tests: public/private projection, URL validation, bilingual content, progress/attachment constraints, origin checks, email retry window.
- PGlite executes the PostgreSQL migration and tests RLS for anonymous, client and admin identities plus atomic email claims and progress updates. The Supabase auth/storage infrastructure is stubbed in that test; hosted public reads validate against the application schemas, and anonymous reads of all five private tables are denied.
- Browser inspection at desktop and mobile sizes, category progression by scrolling, language navigation and admin editing interface.
- Lighthouse scores have not been measured; no 90+ score is claimed. The owner Auth user was created and its ADMIN role explicitly authorized and verified in Supabase. Interactive login, live uploads and email delivery still require end-to-end checks; no admin password is stored in this repository.

## Signature

```tsx
import { MadeByHass } from "@hass/branding";
<MadeByHass href="https://YOUR-DOMAIN" variant="minimal" newTab utm="client-site" />
```

Variants: minimal, light, dark, compact. For plain HTML, use a standard accessible link with the same copy:

```html
<a href="https://YOUR-DOMAIN" target="_blank" rel="noopener noreferrer" aria-label="Designed and developed by HASS Studio">Made with care by HASS Studio ↗</a>
```

