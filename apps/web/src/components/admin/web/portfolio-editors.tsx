"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  lines,
  pad,
  slugify,
  workCover,
  workMedia,
  type Category,
  type Locale,
  type Work,
} from "@/lib/content";
import {
  BiField,
  Card,
  Field,
  LangSwitch,
  LaptopPreview,
  MediaManager,
  MediaPicker,
  SaveBar,
  Switch,
  Thumb,
  useAdmin,
  useDraft,
} from "./kit";

const emptyBi = () => ({ en: "", es: "" });
const name = (c?: Pick<Category, "title">) => (c ? c.title.es || c.title.en || "Sin nombre" : "");
const cleanSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 120);
const moveId = (ids: string[], from: number, to: number) => {
  const next = [...ids];
  const [id] = next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
};

export function ServicesBoard({ categories, works }: { categories: Category[]; works: Work[] }) {
  const { base, reorder, notify, preview } = useAdmin();
  const [busy, setBusy] = useState(false);
  async function move(from: number, to: number) {
    setBusy(true);
    try {
      await reorder("categories", moveId(categories.map((c) => c.id), from, to));
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo reordenar.", "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ol className="how-it-works">
        <li>
          <b>01</b>
          <span>
            Cada <strong>servicio</strong> es una diapositiva del carrusel de la portada.
          </span>
        </li>
        <li>
          <b>02</b>
          <span>
            Dentro de cada servicio añades tus <strong>trabajos</strong> reales con fotos y vídeos.
          </span>
        </li>
        <li>
          <b>03</b>
          <span>
            Al entrar en un trabajo, sus pantallas se muestran en la <strong>laptop con espejos</strong>.
          </span>
        </li>
      </ol>
      <div className="service-tiles">
        {categories.map((c, i) => {
          const own = works.filter((w) => w.category_id === c.id);
          const live = own.filter((w) => w.published).length;
          return (
            <article className="service-tile" key={c.id}>
              <Link href={base + "/web/servicios/" + c.id} className="service-tile-media">
                <Thumb src={c.image || own.map(workCover)[0] || ""} />
                <span className="service-tile-title">
                  <small>Diapositiva {pad(i + 1)}</small>
                  {name(c)}
                </span>
              </Link>
              <div className="service-tile-body">
                <p>
                  <b>{own.length}</b> {own.length === 1 ? "trabajo" : "trabajos"} ·{" "}
                  <b>{live}</b> {live === 1 ? "publicado" : "publicados"}
                </p>
                <div className="tile-actions">
                  <button
                    type="button"
                    onClick={() => void move(i, i - 1)}
                    disabled={busy || preview || i === 0}
                    aria-label="Mover antes"
                    title="Mover antes"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(i, i + 1)}
                    disabled={busy || preview || i === categories.length - 1}
                    aria-label="Mover después"
                    title="Mover después"
                  >
                    →
                  </button>
                  <Link className="admin-primary" href={base + "/web/servicios/" + c.id}>
                    Abrir y editar
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
        <Link className="service-tile is-new" href={base + "/web/servicios/nuevo"}>
          <b>+</b>
          <span>Nuevo servicio</span>
          <small>Por ejemplo: Branding, E-commerce…</small>
        </Link>
      </div>
    </>
  );
}

export function ServiceDetail({
  service,
  isNew,
  categories,
  works,
}: {
  service: Category;
  isNew: boolean;
  categories: Category[];
  works: Work[];
}) {
  const admin = useAdmin();
  const { draft: c, setDraft, dirty, reset } = useDraft(service, isNew);
  const [lang, setLang] = useState<Locale>("es");
  const [idTouched, setIdTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const own = works.filter((w) => w.category_id === service.id);
  const index = categories.findIndex((x) => x.id === service.id);
  const cover = c.image || own.map(workCover)[0] || "";

  async function save() {
    if (!c.title.es.trim() && !c.title.en.trim()) throw new Error("Ponle un nombre al servicio.");
    const id = c.id || slugify(c.title.es || c.title.en);
    if (!/^[a-z0-9-]+$/.test(id))
      throw new Error("La dirección solo puede tener letras minúsculas, números y guiones.");
    if (isNew && categories.some((x) => x.id === id))
      throw new Error("Ya existe un servicio con la dirección «" + id + "».");
    await admin.save("categories", { ...c, id });
    if (isNew) admin.navigate(admin.base + "/web/servicios/" + id);
  }
  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (e) {
      admin.notify(e instanceof Error ? e.message : "No se pudo completar.", "error");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm("¿Eliminar el servicio «" + name(c) + "»? No se puede deshacer.")) return;
    await admin.remove("categories", service.id);
    admin.navigate(admin.base + "/web/servicios");
  }

  return (
    <>
      <div className="editor-layout">
        <div className="editor-main">
          <LangSwitch lang={lang} setLang={setLang} values={[c.title, c.description, c.services]} />
          <Card
            title="Diapositiva del carrusel"
            intro="Lo que se ve en la portada y en la parte superior de la página del servicio."
          >
            <BiField
              label="Nombre del servicio"
              lang={lang}
              value={c.title}
              placeholder="Experiencias web"
              onChange={(title) =>
                setDraft((d) => ({
                  ...d,
                  title,
                  id: idTouched ? d.id : slugify(title.es || title.en),
                }))
              }
              hint="Corto: se muestra enorme."
            />
            <BiField
              label="Frase corta"
              lang={lang}
              rows={2}
              value={c.description}
              onChange={(description) => setDraft((d) => ({ ...d, description }))}
              placeholder="Una primera impresión. Una sensación que permanece."
            />
            <BiField
              label="Qué incluye"
              lang={lang}
              value={c.services}
              onChange={(services) => setDraft((d) => ({ ...d, services }))}
              placeholder="Dirección de arte · UI/UX · Desarrollo"
            />
            <div className="kit-row">
              <MediaPicker
                label="Imagen o vídeo de fondo"
                kind="media"
                value={c.image}
                onChange={(image) => setDraft((d) => ({ ...d, image }))}
                hint="Si lo dejas vacío se usa la miniatura de su primer trabajo."
              />
              <Field
                label="Dirección de la página"
                hint={"Tu web: /" + lang + "/services/" + (c.id || "…")}
              >
                <input
                  value={c.id}
                  disabled={!isNew}
                  onChange={(e) => {
                    setIdTouched(true);
                    setDraft((d) => ({ ...d, id: cleanSlug(e.target.value) }));
                  }}
                />
              </Field>
            </div>
          </Card>

          {isNew ? (
            <div className="kit-empty">
              <strong>Guarda el servicio para empezar a añadir sus trabajos.</strong>
            </div>
          ) : (
            <Card
              title={"Trabajos de este servicio · " + own.length}
              intro="Solo los publicados aparecen en la web. Usa las flechas para cambiar el orden."
              aside={
                <Link className="admin-primary" href={admin.base + "/web/trabajos/nuevo?servicio=" + service.id}>
                  + Añadir trabajo
                </Link>
              }
            >
              {own.length ? (
                <div className="work-tiles">
                  {own.map((w, i) => (
                    <article className={"work-tile" + (w.published ? "" : " is-draft")} key={w.id}>
                      <Link href={admin.base + "/web/trabajos/" + w.id} className="work-tile-media">
                        <Thumb src={workCover(w)} />
                        <span className={"status-pill" + (w.published ? " is-live" : "")}>
                          {w.published ? "Publicado" : "Borrador"}
                        </span>
                      </Link>
                      <div className="work-tile-body">
                        <h3>
                          <Link href={admin.base + "/web/trabajos/" + w.id}>{w.title}</Link>
                        </h3>
                        <small>
                          {w.year} · {workMedia(w).length}{" "}
                          {workMedia(w).length === 1 ? "pantalla" : "pantallas"}
                          {w.concept ? " · Estudio de diseño" : ""}
                        </small>
                        <div className="tile-actions">
                          <button
                            type="button"
                            aria-label="Mover antes"
                            disabled={busy || admin.preview || i === 0}
                            onClick={() =>
                              void run(() => admin.reorder("works", moveId(own.map((x) => x.id), i, i - 1)))
                            }
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            aria-label="Mover después"
                            disabled={busy || admin.preview || i === own.length - 1}
                            onClick={() =>
                              void run(() => admin.reorder("works", moveId(own.map((x) => x.id), i, i + 1)))
                            }
                          >
                            →
                          </button>
                          <button
                            type="button"
                            disabled={busy || admin.preview}
                            onClick={() =>
                              void run(() => admin.save("works", { ...w, published: !w.published }))
                            }
                          >
                            {w.published ? "Ocultar" : "Publicar"}
                          </button>
                          <Link className="admin-secondary" href={admin.base + "/web/trabajos/" + w.id}>
                            Editar
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="kit-empty">
                  <strong>Este servicio aún no tiene trabajos.</strong>
                  <p>Añade tu primer proyecto real con sus capturas o vídeos.</p>
                </div>
              )}
            </Card>
          )}

          {!isNew && (
            <div className="danger-zone">
              <div>
                <strong>Eliminar servicio</strong>
                <small>
                  {own.length
                    ? "Primero elimina sus trabajos o muévelos a otro servicio."
                    : "Desaparecerá del carrusel y de la web."}
                </small>
              </div>
              <button
                type="button"
                className="kit-danger"
                disabled={!!own.length || busy || admin.preview}
                onClick={() => void run(remove)}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
        <aside className="editor-side">
          <div className="sticky-preview">
            <span className="admin-overline">VISTA PREVIA DE LA DIAPOSITIVA</span>
            <div className="slide-preview">
              <Thumb src={cover} />
              <div>
                <small>
                  {pad(Math.max(index, 0) + 1)} / {pad(categories.length + (isNew ? 1 : 0))}
                </small>
                <em>{lines(c.description[lang] || c.description.en).join(" ")}</em>
                <strong>{c.title[lang] || c.title.en || "Nombre del servicio"}</strong>
                <span className="slide-preview-card">
                  <Thumb src={own.map(workCover)[0] || cover} />
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <SaveBar
        dirty={dirty}
        onReset={isNew ? undefined : reset}
        onSave={save}
        view={isNew ? undefined : "/" + lang + "/services/" + service.id}
      />
    </>
  );
}

export function blankWork(categories: Category[], works: Work[], serviceId?: string | null): Work {
  const category = categories.find((c) => c.id === serviceId) ?? categories[0];
  return {
    id: crypto.randomUUID(),
    slug: "",
    title: "",
    category_id: category?.id ?? "",
    year: new Date().getFullYear(),
    cover: "",
    video: "",
    url: "",
    description: emptyBi(),
    challenge: emptyBi(),
    approach: emptyBi(),
    services: [],
    gallery: [],
    featured: false,
    published: true,
    concept: false,
    kind: category?.kind ?? "website",
    sort_order: works.filter((w) => w.category_id === category?.id).length,
  };
}

export function WorkEditor({
  work,
  isNew,
  categories,
  works,
}: {
  work: Work;
  isNew: boolean;
  categories: Category[];
  works: Work[];
}) {
  const admin = useAdmin();
  // Older entries kept a separate video; the editor treats every screen the same way.
  const saved = useMemo(
    () => ({ ...work, video: "", gallery: work.video || work.gallery.length ? workMedia({ ...work, cover: "" }) : [] }),
    [work],
  );
  const { draft: w, setDraft, dirty, reset } = useDraft(saved, isNew);
  const [lang, setLang] = useState<Locale>("es");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const savedTags = work.services.join(", ");
  const [tags, setTags] = useState(savedTags);
  const [seenTags, setSeenTags] = useState(savedTags);
  if (seenTags !== savedTags) {
    setSeenTags(savedTags);
    setTags(savedTags);
  }
  const [busy, setBusy] = useState(false);
  const service = categories.find((c) => c.id === w.category_id);
  const set = <K extends keyof Work>(key: K, value: Work[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function save() {
    const title = w.title.trim();
    if (!title) throw new Error("Escribe el título del trabajo.");
    if (!w.category_id) throw new Error("Elige a qué servicio pertenece.");
    const slug = w.slug.replace(/^-+|-+$/g, "") || slugify(title);
    if (!slug) throw new Error("Escribe una dirección válida en «Más detalles».");
    if (works.some((x) => x.slug === slug && x.id !== w.id))
      throw new Error("Ya tienes un trabajo con la dirección «" + slug + "». Cámbiala en «Más detalles».");
    if (w.url && !/^https:\/\/\S+$/.test(w.url.trim()))
      throw new Error("El enlace debe empezar por https://");
    await admin.save("works", {
      ...w,
      title,
      slug,
      url: w.url.trim(),
      services: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12),
    });
    if (isNew) admin.navigate(admin.base + "/web/trabajos/" + w.id);
  }
  async function remove() {
    if (!window.confirm("¿Eliminar «" + (w.title || "este trabajo") + "»? No se puede deshacer.")) return;
    setBusy(true);
    try {
      await admin.remove("works", work.id);
      admin.navigate(admin.base + "/web/servicios/" + work.category_id);
    } catch (e) {
      admin.notify(e instanceof Error ? e.message : "No se pudo eliminar.", "error");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="editor-layout">
        <div className="editor-main">
          <Card title="Información básica">
            <Field label="Título del trabajo">
              <input
                className="input-large"
                value={w.title}
                placeholder="Nombre del proyecto"
                onChange={(e) => {
                  const title = e.target.value;
                  setDraft((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }));
                }}
              />
            </Field>
            <div className="kit-row">
              <Field label="Servicio">
                <select value={w.category_id} onChange={(e) => set("category_id", e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {name(c)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Año">
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={w.year}
                  onChange={(e) => set("year", Number(e.target.value) || new Date().getFullYear())}
                />
              </Field>
            </div>
            <Field
              label="Enlace al proyecto (opcional)"
              hint="Si lo dejas vacío, el botón «Visitar sitio» no aparece."
            >
              <input
                type="url"
                value={w.url}
                placeholder="https://"
                onChange={(e) => set("url", e.target.value)}
              />
            </Field>
          </Card>

          <LangSwitch lang={lang} setLang={setLang} values={[w.description, w.challenge, w.approach]} />
          <Card title="Descripción corta" intro="Dos o tres frases. Aparece junto al título, antes de la laptop.">
            <BiField
              label="Descripción"
              lang={lang}
              rows={4}
              value={w.description}
              onChange={(description) => set("description", description)}
            />
          </Card>

          <Card
            title={"Pantallas de la laptop · " + w.gallery.length}
            intro="Se muestran una tras otra dentro de la laptop mientras la persona hace scroll. Arrastra para ordenarlas."
          >
            <MediaManager
              items={w.gallery}
              setItems={(update) => setDraft((d) => ({ ...d, gallery: update(d.gallery) }))}
            />
            <ul className="kit-tips">
              <li>
                <b>Captura horizontal</b> llena la pantalla.
              </li>
              <li>
                <b>Captura de página completa</b> (larga, de 1440 px de ancho o más) se desplaza dentro de la
                laptop.
              </li>
              <li>
                <b>Captura de móvil</b> se centra sobre un fondo difuminado.
              </li>
              <li>
                <b>Vídeo MP4, WebM o MOV</b> se reproduce en bucle y sin sonido, optimizado automáticamente. Máximo 100 MB.
              </li>
            </ul>
            {!w.gallery.length && w.cover && (
              <p className="kit-note">Mientras no añadas pantallas, la laptop muestra la miniatura.</p>
            )}
          </Card>

          <Card
            title="Miniatura"
            intro="La imagen de su tarjeta en la página del servicio y en el carrusel. Si no eliges una, se usa la primera pantalla."
          >
            <div className="kit-row">
              <MediaPicker
                label="Miniatura: foto o vídeo (opcional)"
                kind="media"
                ratio="4 / 3"
                value={w.cover}
                onChange={(cover) => set("cover", cover)}
              />
              <div />
            </div>
          </Card>

          <details className="kit-more" open={!isNew && !!(w.challenge.es || w.challenge.en)}>
            <summary>Más detalles (opcional)</summary>
            <Card title="Detalles del caso">
              <Field label="Etiquetas" hint="Separadas por comas. Ejemplo: Dirección de arte, UI/UX, Desarrollo">
                <input value={tags} onChange={(e) => setTags(e.target.value)} />
              </Field>
              <BiField
                label="El reto"
                lang={lang}
                rows={3}
                value={w.challenge}
                onChange={(challenge) => set("challenge", challenge)}
              />
              <BiField
                label="El enfoque"
                lang={lang}
                rows={3}
                value={w.approach}
                onChange={(approach) => set("approach", approach)}
              />
              <Field label="Dirección de la página" hint={"Tu web: /" + lang + "/work/" + (w.slug || "…")}>
                <input
                  value={w.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", cleanSlug(e.target.value));
                  }}
                />
              </Field>
              <Switch
                checked={w.concept}
                onChange={(concept) => set("concept", concept)}
                label="Es un estudio de diseño (no un cliente real)"
                hint="Muestra la etiqueta «Estudio de diseño»."
              />
            </Card>
          </details>
        </div>

        <aside className="editor-side">
          <div className="sticky-preview">
            <div className="publish-box">
              <Switch
                checked={w.published}
                onChange={(published) => set("published", published)}
                label="Visible en la web"
                hint={w.published ? "Se publica al guardar." : "Borrador: solo lo ves tú."}
              />
              <Switch
                checked={w.featured}
                onChange={(featured) => set("featured", featured)}
                label="Destacar en la portada"
                hint="Aparece en la tira de trabajos de la página de inicio."
              />
            </div>
            <LaptopPreview src={w.gallery[0] || w.cover} />
            <div className="preview-meta">
              <strong>{w.title || "Sin título"}</strong>
              <small>
                {name(service)} · {w.year}
                {w.url ? " · con enlace" : ""}
              </small>
              {(w.description[lang] || w.description.en) && <p>{w.description[lang] || w.description.en}</p>}
            </div>
            {!isNew && (
              <button
                type="button"
                className="kit-danger is-block"
                disabled={busy || admin.preview}
                onClick={() => void remove()}
              >
                Eliminar trabajo
              </button>
            )}
          </div>
        </aside>
      </div>
      <SaveBar
        dirty={dirty || tags !== savedTags}
        onReset={
          isNew
            ? undefined
            : () => {
                reset();
                setTags(savedTags);
              }
        }
        onSave={save}
        view={!isNew && work.published ? "/" + lang + "/work/" + work.slug : undefined}
        label={w.published ? "Guardar y publicar" : "Guardar borrador"}
      />
    </>
  );
}
