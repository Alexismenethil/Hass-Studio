# HASS Studio

Alexis Huamani Rivera's bilingual design studio. A cinematic public portfolio and a private workspace.

## Published preview

https://hass-studio.vercel.app — deployed to the HASS Studio project in the existing Vercel team. Supabase is connected to the live site: project `vgsywzswnxsbszrwfgwu`, with bilingual settings, three categories and the real projects (Golden Pearl, FFC Siding Solutions, SubeYA). The owner account has its ADMIN role activated; email delivery remains pending.

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

- Identity: espresso and cream with one caramel light (tokens in `apps/web/src/styles/globals.css`), Instrument Serif for display and DM Sans for text. The arch stays as the shape that reveals photographs.
- Home, in four scenes:
  - **The flight.** Only the title, in a cream morning, while the real work — every page and phone screen of the featured projects — hangs in 3D space around it, and a quiet ring at the foot of the screen. Scrolling flies the camera (rolling a little) through the pictures: they come out of the haze behind the title, grow and pass either side, and the lines of the panel's «Frases que flotan en el vuelo» hang in the air to be read and passed through, while the light turns amber and goes down to espresso. Vertical captures are drawn as phones (their shape is read from Cloudinary once and cached). On a desktop the hall leans towards the mouse.
  - **The work, in chapters.** One full-screen chapter per featured project, stacked like cards, with no labels or counters: the project's giant name, a laptop that stands up out of the dark and opens its lid in 3D, its display waking on the site's own scroll-through video, and a phone floating beside it with the mobile version. Below it, one line in the title's type says what it is, beside a ring to step inside. When the next chapter slides over, the previous one sinks into the dark. "Explore the project" dives: the laptop flies into the project page's own laptop without a jump.
  - **The studio note**, written in as it is read: the paragraph starts as a watermark and a reading cursor tied to its scroll inks it word by word, each word glowing caramel for an instant; a photograph in an arch, and the services as large rows.
  - **The footer**: the invitation, a caramel button, and the studio's name standing up out of the floor letter by letter.
- Work pages (`/[lang]/work/[slug]`): the laptop scene plays the video and the first page screens; below it, the description, the challenge and the approach, the remaining pages in browser windows that tilt up as they arrive, and the phone screens on a native swipe rail. Every project leads to the next.
- Work index (`/[lang]/work`): large staggered cards. Services (`/[lang]/services`) keep the cinematic carousel; service pages list their work in dark rooms. Studio, contact and links share the same palette.
- All scroll-linked motion (the flight, the chapters, the word focus, the arch, the footer) is CSS scroll-driven animation on view timelines, so the browser runs it off the main thread; browsers without support show every scene in its finished state, and reduced motion turns it all off. Script only plays the video on screen and leans the hall towards a desktop mouse. Native scrolling throughout, no scroll hijacking, no animation library.
- Real projects published: Golden Pearl, FFC Siding Solutions and SubeYA, with page captures, phone captures and a scroll-through video of each live site, hosted on Cloudinary (folder `hass-studio/proyectos`). The earlier design studies (Forma, Savia) are unpublished, not deleted.
- Supabase-backed bilingual content, all editable from the panel.

## Editing the website (panel)

`/admin` separates **Tu web** (public) from **Clientes** (private, never published):

- **Página de inicio** — the small line, big phrase and short line of the opening, the projects title, the studio note and its photograph, and the image used when the link is shared.
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

The current laptop frame is laptop-frontal.webp; laptop-navy.png is a discarded earlier art-direction variant retained only among originals. Generated originals: assets/originals. Optimized web files: apps/web/public/images. Prompt set and generation method: docs/IMAGE-PROMPTS.md. 

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

