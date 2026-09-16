# Verification — final warm palette version

- Local and Vercel production builds passed TypeScript and Next compilation.
- Seven meaningful Node/PostgreSQL tests passed: content boundary, media/URL validation, bilingual settings, update constraints, retry window, same-origin guard, RLS/atomic send/progress sync.
- Browser: desktop and 390 × 844 mobile. Native scroll, shorter category progression, client navigation away from pinned content and language switching verified. No laptop on home. No horizontal overflow at 390px after the project grid fix.
- Detail laptop matches the frontal reference; screen photos change with previous/next controls. A temporary local MP4 verified loading, playback, manual pause/resume and offscreen pause; fixture and test route removed.
- Generated frame preserves alpha; image content remains independent live HTML/video.
- Reduced-motion fallbacks are implemented. No OS-level reduced-motion preference was changed during verification.
- Hosted Supabase: schema and seed applied successfully; 1 settings row, 3 categories and 3 portfolio entries validate with the real public API. Anonymous access to profiles, clients, projects, milestones and project_updates fails with PostgreSQL 42501. Explicit table grants complement RLS; no service-role key is used by the application.
- The owner Auth account was created by the user. Its ADMIN role was explicitly authorized, applied and verified by SQL. The production login form is enabled. Interactive login and storage uploads still await end-to-end checks. Resend remains unconfigured; no client emails sent.
- Production deployment with Supabase: dpl_Fv8CZpduwWCsNuBeAhmU2uSGZKQX, aliased to https://hass-studio.vercel.app.
- Lighthouse score not measured.
