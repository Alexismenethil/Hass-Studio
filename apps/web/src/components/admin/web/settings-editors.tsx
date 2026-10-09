"use client";
import Link from "next/link";
import { useState } from "react";
import { lines, type Locale, type Settings } from "@/lib/content";
import {
  BiField,
  Card,
  Field,
  LangSwitch,
  MediaPicker,
  SaveBar,
  Thumb,
  useAdmin,
  useDraft,
} from "./kit";

function useSettings(settings: Settings) {
  const admin = useAdmin();
  const draft = useDraft(settings);
  const save = () => admin.save("settings", draft.draft);
  return { ...draft, save };
}

export function HomeEditor({ settings }: { settings: Settings }) {
  const { base } = useAdmin();
  const { draft: s, setDraft, dirty, reset, save } = useSettings(settings);
  const [lang, setLang] = useState<Locale>("es");
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <>
      <div className="editor-layout">
        <div className="editor-main">
          <LangSwitch
            lang={lang}
            setLang={setLang}
            values={[s.heroTitle, s.heroDescription, s.workTitle, s.introText]}
          />
          <Card
            title="1 · Portada"
            intro="La primera pantalla: tu frase grande en el centro y las fotos de tus proyectos flotando alrededor en 3D. Al bajar, la cámara vuela entre ellas hacia tus proyectos."
          >
            <BiField
              label="Frase grande"
              lang={lang}
              rows={2}
              value={s.heroTitle}
              onChange={(v) => set("heroTitle", v)}
              hint="Pulsa Enter para partirla en dos líneas. La última línea aparece en cursiva y en color caramelo."
            />
            <BiField
              label="Frases que flotan en el vuelo"
              lang={lang}
              rows={3}
              value={s.heroDescription}
              onChange={(v) => set("heroDescription", v)}
              hint="Aparecen en 3D entre tus proyectos mientras se baja, una tras otra. Una frase por línea (Enter), hasta 3. Déjalo vacío si no quieres ninguna."
            />
            <p className="kit-note">
              Las fotos que flotan son las de tus <b>trabajos destacados</b> (portada y galería de cada uno). Las capturas
              verticales se muestran como teléfonos.
            </p>
            <div className="kit-row">
              <MediaPicker
                label="Imagen al compartir el enlace"
                kind="media"
                value={s.heroImage}
                onChange={(v) => set("heroImage", v)}
                hint="Aparece cuando compartes tu web en WhatsApp o redes. Horizontal, 1200 × 630 o más."
              />
              <div />
            </div>
          </Card>
          <Card
            title="2 · Proyectos"
            intro="Cada trabajo destacado es un capítulo: su nombre gigante, una laptop que se abre con su vídeo o pantallas y un teléfono con su versión móvil."
          >
            <BiField
              label="Título"
              lang={lang}
              rows={2}
              value={s.workTitle}
              onChange={(v) => set("workTitle", v)}
              hint="También es el título de la página Proyectos."
            />
            <p className="kit-note">
              Activa <b>«Destacar en la portada»</b> dentro de cada trabajo. Si no destacas ninguno, se muestran tus
              trabajos en orden.
            </p>
          </Card>
          <Card
            title="3 · Servicios"
            intro="Al final de la portada, tus servicios en una lista. El carrusel completo vive en la página Servicios."
            aside={
              <Link className="admin-secondary" href={base + "/web/servicios"}>
                Editar servicios →
              </Link>
            }
          >
            <p className="kit-note">
              El orden, los títulos, las imágenes y los trabajos se editan en <b>Servicios y trabajos</b>.
            </p>
          </Card>
          <Card title="4 · Sobre el estudio" intro="Tu texto con una foto en arco, justo antes de los servicios.">
            <BiField
              label="Texto"
              lang={lang}
              rows={4}
              value={s.introText}
              onChange={(v) => set("introText", v)}
              hint="Se escribe palabra por palabra al hacer scroll, con un destello caramelo."
            />
            <div className="kit-row">
              <MediaPicker
                label="Foto o vídeo del arco"
                ratio="3 / 4"
                value={s.detailImage}
                onChange={(v) => set("detailImage", v)}
              />
              <div />
            </div>
          </Card>
        </div>
        <aside className="editor-side">
          <div className="sticky-preview">
            <span className="admin-overline">VISTA PREVIA · {lang.toUpperCase()}</span>
            <div className="hero-preview">
              <Thumb src={s.heroImage} />
              <div>
                <strong>
                  {lines(s.heroTitle[lang] || s.heroTitle.en).map((line, i, all) => (
                    <span key={i} className={all.length > 1 && i === all.length - 1 ? "italic" : ""}>
                      {line}
                    </span>
                  ))}
                </strong>
                <small>{(s.heroDescription[lang] || s.heroDescription.en).replace(/\n/g, " ")}</small>
              </div>
            </div>
            <div className="statement-preview">
              <strong>{s.workTitle[lang] || s.workTitle.en}</strong>
              <small>{s.introText[lang] || s.introText.en}</small>
            </div>
          </div>
        </aside>
      </div>
      <SaveBar dirty={dirty} onReset={reset} onSave={save} view={"/" + lang} />
    </>
  );
}

export function StudioEditor({ settings }: { settings: Settings }) {
  const { draft: s, setDraft, dirty, reset, save } = useSettings(settings);
  const [lang, setLang] = useState<Locale>("es");
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <>
      <div className="editor-layout">
        <div className="editor-main">
          <LangSwitch
            lang={lang}
            setLang={setLang}
            values={[s.studioTitle, s.studioText, s.availability, s.contactTitle, s.contactText]}
          />
          <Card title="Página Estudio" intro="Quién eres y cómo trabajas.">
            <BiField
              label="Título"
              lang={lang}
              rows={2}
              value={s.studioTitle}
              onChange={(v) => set("studioTitle", v)}
              hint="Enter para partir en dos líneas."
            />
            <BiField
              label="Biografía"
              lang={lang}
              rows={8}
              value={s.studioText}
              onChange={(v) => set("studioText", v)}
              hint="Deja una línea en blanco para separar párrafos."
            />
            <BiField
              label="Frase corta de disponibilidad"
              lang={lang}
              value={s.availability}
              onChange={(v) => set("availability", v)}
            />
            <div className="kit-row">
              <MediaPicker
                label="Tu foto o un vídeo corto"
                ratio="4 / 5"
                value={s.portrait}
                onChange={(v) => set("portrait", v)}
                hint="También aparece pequeña y redonda en el pie de página."
              />
              <div />
            </div>
          </Card>
          <Card title="Contacto" intro="La página Contacto y el pie de página de toda la web.">
            <BiField
              label="Invitación"
              lang={lang}
              rows={2}
              value={s.contactTitle}
              onChange={(v) => set("contactTitle", v)}
              hint="Aparece enorme al final de cada página."
            />
            <BiField
              label="Texto"
              lang={lang}
              rows={3}
              value={s.contactText}
              onChange={(v) => set("contactText", v)}
            />
            <div className="kit-row">
              <MediaPicker
                label="Foto o vídeo de fondo de Contacto"
                value={s.contactImage}
                onChange={(v) => set("contactImage", v)}
                hint="Horizontal. Se oscurece un poco para que el formulario se lea bien. Si lo dejas vacío se mantiene la foto del patio que trae la web."
              />
              <div />
            </div>
            <div className="kit-row">
              <Field label="Email público">
                <input
                  type="email"
                  value={s.email}
                  placeholder="hola@tuestudio.com"
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="WhatsApp" hint="Con código de país, por ejemplo +51 999 999 999">
                <input
                  type="tel"
                  value={s.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                />
              </Field>
            </div>
            <div className="kit-field">
              <span className="kit-label">Redes sociales</span>
              {s.socials.map((social, i) => (
                <div className="social-row" key={i}>
                  <input
                    aria-label="Nombre de la red"
                    placeholder="Instagram"
                    value={social.label}
                    onChange={(e) =>
                      set(
                        "socials",
                        s.socials.map((x, n) => (n === i ? { ...x, label: e.target.value } : x)),
                      )
                    }
                  />
                  <input
                    aria-label="Enlace"
                    type="url"
                    placeholder="https://"
                    value={social.url}
                    onChange={(e) =>
                      set(
                        "socials",
                        s.socials.map((x, n) => (n === i ? { ...x, url: e.target.value } : x)),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="admin-text-button"
                    onClick={() => set("socials", s.socials.filter((_, n) => n !== i))}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-secondary"
                onClick={() => set("socials", [...s.socials, { label: "", url: "" }])}
              >
                + Añadir red
              </button>
            </div>
          </Card>
        </div>
        <aside className="editor-side">
          <div className="sticky-preview">
            <span className="admin-overline">ASÍ SE VE EL PIE DE PÁGINA</span>
            <div className="footer-preview">
              <div>
                {s.portrait && <Thumb src={s.portrait} className="footer-preview-avatar" />}
                <strong>{s.contactTitle[lang] || s.contactTitle.en}</strong>
              </div>
              <span className="footer-preview-orb">{lang === "es" ? "Escríbenos" : "Get in touch"}</span>
              <small>
                {[s.email, s.whatsapp && "WhatsApp"].filter(Boolean).join(" · ") ||
                  "Añade tu email o WhatsApp"}
              </small>
            </div>
          </div>
        </aside>
      </div>
      <SaveBar dirty={dirty} onReset={reset} onSave={save} view={"/" + lang + "/studio"} />
    </>
  );
}

export function BrandEditor({ settings }: { settings: Settings }) {
  const { draft: s, setDraft, dirty, reset, save } = useSettings(settings);
  const [lang, setLang] = useState<Locale>("es");
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <>
      <div className="editor-layout">
        <div className="editor-main">
          <Card title="Identidad">
            <div className="kit-row">
              <Field label="Nombre de la marca">
                <input value={s.brand} onChange={(e) => set("brand", e.target.value)} />
              </Field>
              <Field label="Tu nombre">
                <input value={s.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
            </div>
            <div className="kit-row">
              <MediaPicker
                label="Logo (opcional)"
                kind="image"
                ratio="5 / 2"
                value={s.logo}
                onChange={(v) => set("logo", v)}
                hint="PNG o WebP con fondo transparente. Sin logo se muestra HASS STUDIO en texto."
              />
              <div />
            </div>
          </Card>
          <LangSwitch lang={lang} setLang={setLang} values={[s.seoTitle, s.seoDescription]} />
          <Card title="Google y redes" intro="Cómo aparece tu web en buscadores y al compartir un enlace.">
            <BiField label="Título" lang={lang} value={s.seoTitle} onChange={(v) => set("seoTitle", v)} />
            <BiField
              label="Descripción"
              lang={lang}
              rows={3}
              value={s.seoDescription}
              onChange={(v) => set("seoDescription", v)}
              hint="Entre 120 y 160 caracteres funciona mejor."
            />
          </Card>
        </div>
        <aside className="editor-side">
          <div className="sticky-preview">
            <span className="admin-overline">RESULTADO EN GOOGLE</span>
            <div className="seo-preview">
              <small>hass-studio.vercel.app › {lang}</small>
              <strong>{s.seoTitle[lang] || s.seoTitle.en}</strong>
              <p>{s.seoDescription[lang] || s.seoDescription.en}</p>
            </div>
          </div>
        </aside>
      </div>
      <SaveBar dirty={dirty} onReset={reset} onSave={save} view={"/" + lang} />
    </>
  );
}
