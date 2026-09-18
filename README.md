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
- Home, in three scenes: a first-visit intro (the sun draws itself, an arch opens onto the hero); the hero photograph, which on a desktop carries a WebGL light of drifting leaf shadows and a warm spot under the pointer (phones get the same light in CSS, no shader), closing into an arch framed by the studio phrase and passing through it into the dark; then **the screening room**, which rises up out of that night at about half the scroll's speed, so the work is already in frame as the hero goes dark. An arch of the project's own light opens from the floor and the laptop stands up inside it: the lid opens, the display wakes with a warm flash, and the name arrives with it. There is nothing else in the room — no counter, no labels, no numbers — just the laptop, its light, its name and two very quiet arrows under the floor line. The work sits side by side on one endless rail of native scroll (three copies of the set, kept in the middle one, so there is always a room to either side and no end to reach); it plays by itself and stops as soon as the reader swipes, drags or steers. Last, a studio note, which arrives as a paper arch swelling up out of the dark, its words coming into focus one after another as they cross the middle of the screen.
- Services moved off the home to their own page (`/[lang]/services`): the carousel where light burns through one service photograph into the next (WebGL on desktop, crossfading photographs on phones), with a 3D drum of giant titles, an arch of that service's work and chapter markers.
- Service pages (`/[lang]/services/[id]`) open their photograph from an arch and list every published work in its own dark room. The work index (`/[lang]/work`) groups all work with a pointer-following preview.
- Work pages (`/[lang]/work/[slug]`): short description, optional "Visit website" link, and a scroll-driven scene — an iris of light closes on a closed laptop, the lid opens in 3D, the display wakes with a warm flash and its reflection settles on the floor. Screens (photos or MP4/WebM) change with scroll; full-page captures travel inside the display, phone captures sit over a blurred copy.
- Clicking a project on the home dives into it: a copy of the room grows to fill the screen and hands its laptop over to the project page, invisibly. Every other page change plays the veil — a band of warm light sweeps the page away, the night follows it and the destination is named on a title card. The footer is a sunset: the sun rises over the horizon with its reflection on the sea.
- Scroll-linked motion (the screening room rising and opening, the arch that reveals every photograph, the drifts, each word of a paragraph coming into focus, the footer's sunset) runs as CSS scroll-driven animations, so the browser keeps it on the compositor and nothing moves layers from script while the page scrolls. Where a browser lacks them, each one simply rests in its finished state. Entrances are one IntersectionObserver plus CSS transitions; there is no animation library in the bundle.
- Native scrolling throughout (sticky sections, short catch-up, no scroll hijacking), letter focus-pull reveals, magnetic buttons, and reduced-motion fallbacks (no intro, grain, veil or WebGL). Phones also skip the film grain and the hero's shader.
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

## Contact form

The Contact page sets a short form (name, email, a service dropdown built from the services, description) over the studio image, next to WhatsApp, email and social links. A "o escríbeme por WhatsApp" link opens WhatsApp with the message already written. /api/contact validates the message, ignores automated senders (hidden trap field and a minimum typing time), limits repeated sends, and emails it through Resend to CONTACT_EMAIL, or to the public email saved in the panel. Replying to that email answers the visitor. It needs RESEND_API_KEY; without a verified domain, EMAIL_FROM can be left empty and Resend's onboarding sender delivers only to the address that owns the Resend account.

## Files and video

Every photo field in the panel also accepts a video. With NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET set, public photos and videos upload straight from the browser to Cloudinary (folder hass-studio) with a signature made by /api/admin/upload, so the secret never reaches the browser. Videos (MP4, WebM or MOV, up to 100 MB) travel in 20 MB pieces and get a light 1920 px MP4 and a poster prepared at upload; the site serves those renditions and falls back to the original file while they are being prepared. Images up to 10 MB are resized and served in the best format by Cloudinary. The API key needs upload permission (Cloudinary Console → Settings → API Keys); if Cloudinary is missing or refuses the key, the panel falls back to Supabase Storage.

Supabase Storage still holds private client files (client-files bucket) and the fallback public uploads (public-media). Files larger than 6 MB use resumable upload. Limit: 50 MB per file; MP4/WebM, JPEG/PNG/WebP/AVIF, and PDF for client attachments.

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

