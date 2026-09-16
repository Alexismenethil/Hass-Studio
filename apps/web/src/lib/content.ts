import { z } from "zod";
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const bi = z.object({
  en: z.string().max(8000),
  es: z.string().max(8000),
});
export type Bilingual = z.infer<typeof bi>;
export const text = (value: Bilingual, locale: Locale) =>
  value[locale] || value.en;
export const safeUrl = z.string().refine(
  (v) =>
    !v ||
    (/^https:\/\//.test(v) &&
      (() => {
        try {
          const u = new URL(v);
          return !u.username && !u.password;
        } catch {
          return false;
        }
      })()),
  "Use a valid HTTPS URL",
);
export const mediaUrl = z.string().refine(
  (v) =>
    !v ||
    (/^\/images\/[a-zA-Z0-9._/-]+$/.test(v) && !v.includes("..")) ||
    (() => {
      try {
        const u = new URL(v);
        return (
          u.protocol === "https:" &&
          u.hostname.endsWith(".supabase.co") &&
          !u.username &&
          !u.password
        );
      } catch {
        return false;
      }
    })(),
  "Use an uploaded image or video",
);
export const settingsSchema = z.object({
  brand: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  email: z.union([z.literal(""), z.email()]),
  whatsapp: z.string().regex(/^\+?[0-9 ]{0,20}$/),
  logo: mediaUrl,
  portrait: mediaUrl,
  heroMobileImage: mediaUrl,
  heroImage: mediaUrl,
  detailImage: mediaUrl,
  studioImage: mediaUrl,
  interludeTitle: bi,
  interludeRibbon: bi,
  availability: bi,
  heroEyebrow: bi,
  heroTitle: bi,
  heroDescription: bi,
  introEyebrow: bi,
  introTitle: bi,
  introText: bi,
  workTitle: bi,
  studioTitle: bi,
  studioText: bi,
  contactTitle: bi,
  contactText: bi,
  seoTitle: bi,
  seoDescription: bi,
  socials: z
    .array(z.object({ label: z.string().min(1).max(40), url: safeUrl }))
    .max(12),
});
export const categorySchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(60),
  title: bi,
  description: bi,
  image: mediaUrl,
  kind: z.enum(["website", "dashboard", "mobile"]),
  services: bi,
  sort_order: z.number().int().min(0),
});
export const workSchema = z.object({
  id: z.uuid(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(120),
  title: z.string().min(1).max(150),
  category_id: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  cover: mediaUrl,
  video: mediaUrl,
  url: safeUrl,
  description: bi,
  challenge: bi,
  approach: bi,
  services: z.array(z.string().max(100)).max(12),
  gallery: z.array(mediaUrl).max(20),
  featured: z.boolean(),
  published: z.boolean(),
  concept: z.boolean(),
  kind: z.enum(["website", "dashboard", "mobile"]),
  sort_order: z.number().int().min(0),
});
export type Settings = z.infer<typeof settingsSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Work = z.infer<typeof workSchema>;
export const isVideo = (url: string) => /\.(mp4|webm)(?:[?#]|$)/i.test(url);
/** Screens shown inside the laptop, in order. Legacy single videos come first. */
export const workMedia = (w: Pick<Work, "video" | "gallery" | "cover">) => {
  const list = [...(w.video ? [w.video] : []), ...w.gallery].filter(Boolean);
  return list.length ? Array.from(new Set(list)) : w.cover ? [w.cover] : [];
};
export const workCover = (w: Pick<Work, "video" | "gallery" | "cover">) =>
  w.cover ||
  workMedia(w).find((m) => !isVideo(m)) ||
  workMedia(w)[0] ||
  "";
export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
export const pad = (n: number) => String(n).padStart(2, "0");
export const lines = (value: string) => value.split("\n").filter(Boolean);
export const copy = {
  en: {
    work: "Work",
    studio: "Studio",
    contact: "Contact",
    talk: "Let's talk",
    services: "Services",
    service: "Service",
    view: "View",
    drag: "Drag",
    includes: "Includes",
    projects: "Projects",
    selectedWork: "Selected work",
    nextService: "Next service",
    next: "Next project",
    allServices: "All services",
    allWork: "All work",
    live: "Visit website",
    year: "Year",
    scope: "Scope",
    screen: "Screen",
    concept: "Design study",
    challenge: "The challenge",
    approach: "The approach",
    empty: "New work is taking shape. Come back soon.",
    scroll: "Scroll",
    about: "About the studio",
    hello: "Get in touch",
    links: "Around the internet",
    soon: "Contact details will be available soon.",
    made: "Made with intention.",
    menu: "Menu",
    close: "Close menu",
    home: "Home",
    previous: "Previous",
    following: "Next",
    play: "Play video",
    pause: "Pause video",
    local: "Local time",
  },
  es: {
    work: "Proyectos",
    studio: "Estudio",
    contact: "Contacto",
    talk: "Hablemos",
    services: "Servicios",
    service: "Servicio",
    view: "Ver",
    drag: "Arrastra",
    includes: "Incluye",
    projects: "Proyectos",
    selectedWork: "Trabajos seleccionados",
    nextService: "Siguiente servicio",
    next: "Siguiente proyecto",
    allServices: "Todos los servicios",
    allWork: "Todos los proyectos",
    live: "Visitar sitio",
    year: "Año",
    scope: "Alcance",
    screen: "Pantalla",
    concept: "Estudio de diseño",
    challenge: "El reto",
    approach: "El enfoque",
    empty: "Hay nuevos proyectos tomando forma. Vuelve pronto.",
    scroll: "Desliza",
    about: "Sobre el estudio",
    hello: "Escríbenos",
    links: "En otros lugares",
    soon: "Los datos de contacto estarán disponibles pronto.",
    made: "Hecho con intención.",
    menu: "Menú",
    close: "Cerrar menú",
    home: "Inicio",
    previous: "Anterior",
    following: "Siguiente",
    play: "Reproducir vídeo",
    pause: "Pausar vídeo",
    local: "Hora local",
  },
} as const;
