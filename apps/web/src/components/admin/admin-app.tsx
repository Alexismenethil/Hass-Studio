"use client";
import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminSections } from "./admin-sections";
import { type Settings, type Category, type Work } from "@/lib/content";
import { type Project, type Client, type Update, type Milestone, statusLabels } from "@/lib/admin";
import { ClientForm, ProjectForm, MilestoneForm, UpdateForm, type Save } from "./forms";
import { logout } from "@/app/admin/login/actions";
import { AdminContext, type Admin } from "./web/kit";
import { WebOverview } from "./web/overview";
import { HomeEditor, StudioEditor, BrandEditor } from "./web/settings-editors";
import { ServicesBoard, ServiceDetail, WorkEditor, blankWork } from "./web/portfolio-editors";

export type AdminData = {
  settings: Settings;
  categories: Category[];
  works: Work[];
  clients: Client[];
  projects: Project[];
  updates: Update[];
  milestones: Milestone[];
};
export type Editor =
  | { type: "client"; value: Client }
  | { type: "project"; value: Project }
  | { type: "milestone"; value: Milestone }
  | { type: "update"; value: Update };

const groups: { label?: string; note?: string; items: [string, string, string][] }[] = [
  { items: [["", "Inicio", "◈"]] },
  {
    label: "Tu web",
    note: "Lo que ve todo el mundo",
    items: [
      ["web/inicio", "Página de inicio", "◐"],
      ["web/servicios", "Servicios y trabajos", "▦"],
      ["web/estudio", "Estudio y contacto", "◉"],
      ["web/marca", "Marca y SEO", "✦"],
    ],
  },
  {
    label: "Clientes",
    note: "Privado, no sale en la web",
    items: [
      ["projects", "Encargos", "▤"],
      ["clients", "Clientes", "○"],
      ["updates", "Avances por email", "↗"],
    ],
  },
];
const formatDate = (v?: string) =>
  v
    ? new Intl.DateTimeFormat("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(v))
    : "—";

function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const el = ref.current;
    return () => el?.close();
  }, []);
  return (
    <dialog ref={ref} className={"admin-dialog " + (wide ? "wide" : "")} onCancel={onClose}>
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

type View = {
  key: string;
  overline: string;
  title: string;
  intro?: string;
  crumbs?: [string, string][];
  actions?: ReactNode;
  body: ReactNode;
};

export function AdminApp({
  data,
  section,
  query = {},
  preview = false,
}: {
  data: AdminData;
  section: string[];
  query?: { servicio?: string };
  preview?: boolean;
}) {
  const router = useRouter();
  const base = preview ? "/admin/preview" : "/admin";
  const [editor, setEditor] = useState<Editor | null>(null),
    [toast, setToast] = useState<{ message: string; tone: "ok" | "error"; id: number } | null>(null),
    [showArchive, setShowArchive] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [email, setEmail] = useState<{ id: string; html: string; to: string; subject: string } | null>(null),
    [sending, setSending] = useState(false);

  const categories = useMemo(
    () => [...data.categories].sort((a, b) => a.sort_order - b.sort_order),
    [data.categories],
  );
  const works = useMemo(
    () => [...data.works].sort((a, b) => a.sort_order - b.sort_order),
    [data.works],
  );

  const notify = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    setToast({ message, tone, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.tone === "error" ? 7000 : 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => setMenuOpen(false), [section]);

  const post = useCallback(
    async (entity: string, value: unknown) => {
      if (preview) throw new Error("Vista de diseño: conecta Supabase para guardar.");
      const response = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, data: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
      if (!response.ok) throw new Error(result.error || "No se pudo guardar.");
      router.refresh();
    },
    [preview, router],
  );
  const admin: Admin = useMemo(
    () => ({
      base,
      preview,
      save: async (entity, value) => {
        await post(entity, value);
        notify("Guardado y publicado.");
      },
      remove: async (table, id) => {
        await post("delete", { table, id });
        notify("Eliminado.");
      },
      reorder: (table, ids) => post("reorder", { table, ids }),
      notify,
      navigate: (path) => router.push(path),
    }),
    [base, preview, post, notify, router],
  );
  // Private client forms close their dialog after saving.
  const save: Save = async (entity, value) => {
    await post(entity, value);
    setEditor(null);
    notify("Cambios guardados.");
  };
  const safeSave = (entity: string, value: unknown) =>
    void save(entity, value).catch((e) => notify(e.message, "error"));

  const newClient = () =>
    setEditor({ type: "client", value: { id: crypto.randomUUID(), name: "", email: "", company: "" } });
  const newProject = () =>
    setEditor({
      type: "project",
      value: {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        client_id: null,
        status: "PLANNING",
        progress: 0,
        start_date: null,
        estimated_delivery_date: null,
        archived: false,
      },
    });
  const newUpdate = (p: Project) =>
    setEditor({
      type: "update",
      value: {
        id: crypto.randomUUID(),
        project_id: p.id,
        title: "",
        message: "",
        progress: p.progress,
        preview_url: "",
        language: "en",
        attachments: [],
        status: "DRAFT",
        created_at: new Date().toISOString(),
      },
    });
  async function emailPreview(u: Update) {
    try {
      const res = await fetch("/api/admin/email/" + u.id);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setEmail({ id: u.id, ...body });
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo preparar el correo.", "error");
    }
  }
  async function sendEmail() {
    if (!email) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/email/" + email.id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      notify("Correo aceptado por el proveedor.");
      setEmail(null);
      router.refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : "No se pudo enviar.", "error");
      router.refresh();
    } finally {
      setSending(false);
    }
  }
  const active = data.projects.filter(
    (p) => !p.archived && !["COMPLETED", "CANCELLED"].includes(p.status),
  );
  const updates = [...data.updates].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const upcoming = data.milestones
    .filter((m) => !m.completed)
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
  function updateList(items: Update[]) {
    return items.length ? (
      <div className="update-list">
        {items.map((u, i) => (
          <article key={u.id}>
            <div className="timeline-dot" />
            <div className="update-main">
              <span className="admin-overline">
                AVANCE {String(items.length - i).padStart(2, "0")} · {formatDate(u.created_at)}
              </span>
              <h3>{u.title}</h3>
              <p>{u.message}</p>
              <div className="update-footer">
                <span className={"badge badge-" + u.status.toLowerCase()}>{statusLabels[u.status]}</span>
                <span>{u.progress}%</span>
                {u.status === "DRAFT" && (
                  <button onClick={() => setEditor({ type: "update", value: u })}>Editar</button>
                )}
                <button disabled={preview} onClick={() => void emailPreview(u)}>
                  {u.status === "SENT"
                    ? "Ver correo"
                    : u.status === "DRAFT"
                      ? "Previsualizar y enviar"
                      : "Revisar / reintentar"}{" "}
                  ↗
                </button>
              </div>
              {u.email_error && <p className="form-error">{u.email_error}</p>}
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="admin-empty">
        <span>↗</span>
        <h3>El próximo avance empieza aquí.</h3>
        <p>Guarda una actualización, revisa el correo y compártelo con tu cliente.</p>
      </div>
    );
  }
  const privateSections = (page: string, detail?: Project) => (
    <AdminSections
      page={page}
      data={data}
      detail={detail}
      active={active}
      upcoming={upcoming}
      updates={updates}
      preview={preview}
      newProject={newProject}
      showArchive={showArchive}
      setShowArchive={setShowArchive}
      updateList={updateList}
      setEditor={setEditor}
      newUpdate={newUpdate}
      safeSave={safeSave}
      save={save}
    />
  );

  const [s0 = "", s1 = "", s2 = ""] = section;
  const servicesCrumb: [string, string] = ["Servicios y trabajos", base + "/web/servicios"];
  const notFound: View = {
    key: "missing",
    overline: "NO ENCONTRADO",
    title: "Esta página ya no existe.",
    intro: "Puede que se haya eliminado.",
    body: (
      <Link className="admin-primary" href={base}>
        Volver al inicio
      </Link>
    ),
  };
  let view: View;
  if (s0 === "web" && s1 === "inicio")
    view = {
      key: "home",
      overline: "TU WEB",
      title: "Página de inicio",
      intro: "Portada, carrusel de servicios y la frase del estudio.",
      body: <HomeEditor settings={data.settings} />,
    };
  else if (s0 === "web" && s1 === "servicios" && !s2)
    view = {
      key: "services",
      overline: "TU WEB",
      title: "Servicios y trabajos",
      intro: "Abre un servicio para editar su diapositiva y añadir o quitar trabajos.",
      actions: (
        <Link className="admin-primary" href={base + "/web/trabajos/nuevo"}>
          + Añadir trabajo
        </Link>
      ),
      body: <ServicesBoard categories={categories} works={works} />,
    };
  else if (s0 === "web" && s1 === "servicios") {
    const isNew = s2 === "nuevo";
    const service: Category | undefined = isNew
      ? {
          id: "",
          title: { en: "", es: "" },
          description: { en: "", es: "" },
          services: { en: "", es: "" },
          image: "",
          kind: "website",
          sort_order: categories.length,
        }
      : categories.find((c) => c.id === s2);
    view = service
      ? {
          key: "service-" + s2,
          overline: isNew ? "NUEVO SERVICIO" : "SERVICIO",
          title: isNew ? "Nuevo servicio" : service.title.es || service.title.en,
          crumbs: [servicesCrumb],
          body: (
            <ServiceDetail key={s2} service={service} isNew={isNew} categories={categories} works={works} />
          ),
        }
      : notFound;
  } else if (s0 === "web" && s1 === "trabajos") {
    const isNew = s2 === "nuevo";
    const work = isNew ? null : works.find((w) => w.id === s2);
    const service = categories.find((c) => c.id === (work?.category_id ?? query.servicio));
    view =
      !categories.length
        ? {
            key: "no-services",
            overline: "TU WEB",
            title: "Primero crea un servicio",
            intro: "Cada trabajo pertenece a un servicio.",
            body: (
              <Link className="admin-primary" href={base + "/web/servicios/nuevo"}>
                + Nuevo servicio
              </Link>
            ),
          }
        : isNew || work
          ? {
              key: "work-" + s2,
              overline: isNew ? "NUEVO TRABAJO" : "TRABAJO",
              title: isNew ? "Nuevo trabajo" : work!.title,
              crumbs: [
                servicesCrumb,
                ...(service
                  ? [[service.title.es || service.title.en, base + "/web/servicios/" + service.id] as [string, string]]
                  : []),
              ],
              body: isNew ? (
                <NewWork key={"new-" + (query.servicio ?? "")} categories={categories} works={works} serviceId={query.servicio} />
              ) : (
                <WorkEditor key={work!.id} work={work!} isNew={false} categories={categories} works={works} />
              ),
            }
          : notFound;
  } else if (s0 === "web" && s1 === "estudio")
    view = {
      key: "studio",
      overline: "TU WEB",
      title: "Estudio y contacto",
      intro: "Tu biografía, tu foto y cómo pueden escribirte.",
      body: <StudioEditor settings={data.settings} />,
    };
  else if (s0 === "web" && s1 === "marca")
    view = {
      key: "brand",
      overline: "TU WEB",
      title: "Marca y SEO",
      body: <BrandEditor settings={data.settings} />,
    };
  else if (s0 === "projects" && s1) {
    const detail = data.projects.find((p) => p.id === s1);
    view = detail
      ? {
          key: "project",
          overline: "CLIENTES · PRIVADO",
          title: detail.name,
          intro: data.clients.find((c) => c.id === detail.client_id)?.name || "Cliente sin asignar",
          crumbs: [["Encargos", base + "/projects"]],
          actions: (
            <button className="admin-secondary" onClick={() => setEditor({ type: "project", value: detail })}>
              Editar encargo
            </button>
          ),
          body: privateSections("projects", detail),
        }
      : notFound;
  } else if (s0 === "projects")
    view = {
      key: "projects",
      overline: "CLIENTES · PRIVADO",
      title: "Encargos",
      intro: "Proyectos que haces para clientes: estado, hitos y avances. No se publican en la web.",
      actions: (
        <button className="admin-primary" onClick={newProject}>
          + Nuevo encargo
        </button>
      ),
      body: privateSections("projects"),
    };
  else if (s0 === "clients")
    view = {
      key: "clients",
      overline: "CLIENTES · PRIVADO",
      title: "Clientes",
      actions: (
        <button className="admin-primary" onClick={newClient}>
          + Nuevo cliente
        </button>
      ),
      body: privateSections("clients"),
    };
  else if (s0 === "updates")
    view = {
      key: "updates",
      overline: "CLIENTES · PRIVADO",
      title: "Avances por email",
      intro: "Actualizaciones que envías a tus clientes.",
      body: privateSections("updates"),
    };
  else if (!s0)
    view = {
      key: "overview",
      overline: "HASS STUDIO",
      title: "Hola, " + data.settings.name.split(" ")[0] + ".",
      intro: "¿Qué quieres cambiar hoy?",
      actions: (
        <Link className="admin-primary" href={base + "/web/trabajos/nuevo"}>
          + Añadir trabajo
        </Link>
      ),
      body: (
        <>
          <WebOverview settings={data.settings} categories={categories} works={works} />
          {privateSections("")}
        </>
      ),
    };
  else view = notFound;

  const current = s0 === "web" ? "web/" + s1 : s0;
  return (
    <AdminContext.Provider value={admin}>
      <div className={"admin-shell" + (menuOpen ? " menu-open" : "")}>
        <aside className="admin-sidebar">
          <Link href={base} className="admin-brand">
            HASS<small>STUDIO · PANEL</small>
          </Link>
          <nav>
            {groups.map((group, i) => (
              <div className="nav-group" key={i}>
                {group.label && (
                  <span className="nav-label">
                    {group.label}
                    <small>{group.note}</small>
                  </span>
                )}
                {group.items.map(([key, label, icon]) => (
                  <Link
                    key={key}
                    href={base + (key ? "/" + key : "")}
                    className={current === key ? "active" : ""}
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <a href="/es" target="_blank" rel="noreferrer" className="admin-secondary">
              Ver mi web ↗
            </a>
            {!preview && (
              <form action={logout}>
                <button>Cerrar sesión</button>
              </form>
            )}
          </div>
        </aside>
        <div className="admin-main">
          <header className="admin-topbar">
            <button className="admin-menu" onClick={() => setMenuOpen((o) => !o)} aria-label="Menú">
              ☰
            </button>
            <nav aria-label="Ruta">
              <Link href={base}>Panel</Link>
              {view.crumbs?.map(([label, href]) => (
                <span key={href}>
                  <i>/</i>
                  <Link href={href}>{label}</Link>
                </span>
              ))}
              {view.key !== "overview" && (
                <span>
                  <i>/</i>
                  {view.title}
                </span>
              )}
            </nav>
            <div>
              <span className="connection-dot" />
              {preview ? "Vista de diseño" : "Conectado"}
            </div>
          </header>
          {preview && (
            <div className="preview-banner">
              Vista de diseño · Guardar y subir archivos se habilita al iniciar sesión.{" "}
              <Link href="/admin/login">Iniciar sesión ↗</Link>
            </div>
          )}
          <main className="admin-content" key={view.key}>
            <div className="admin-page-heading">
              <div>
                <span className="admin-overline">{view.overline}</span>
                <h1>{view.title}</h1>
                {view.intro && <p>{view.intro}</p>}
              </div>
              {view.actions}
            </div>
            {view.body}
          </main>
        </div>
        {toast && (
          <div className={"admin-toast is-" + toast.tone} role="status" key={toast.id}>
            {toast.message}
            <button aria-label="Cerrar aviso" onClick={() => setToast(null)}>
              ×
            </button>
          </div>
        )}
        {editor && (
          <Dialog
            title={
              {
                client: "Cliente",
                project: "Encargo",
                milestone: "Nuevo hito",
                update: "Avance del encargo",
              }[editor.type]
            }
            onClose={() => setEditor(null)}
          >
            {editor.type === "client" ? (
              <ClientForm value={editor.value} save={save} preview={preview} />
            ) : editor.type === "project" ? (
              <ProjectForm value={editor.value} save={save} clients={data.clients} preview={preview} />
            ) : editor.type === "milestone" ? (
              <MilestoneForm value={editor.value} save={save} preview={preview} />
            ) : (
              <UpdateForm value={editor.value} save={save} preview={preview} />
            )}
          </Dialog>
        )}
        {email && (
          <Dialog title="Previsualizar actualización" wide onClose={() => !sending && setEmail(null)}>
            <div className="email-meta">
              <span>
                Para: <strong>{email.to}</strong>
              </span>
              <span>Asunto: {email.subject}</span>
            </div>
            <iframe title="Vista previa del correo" srcDoc={email.html} sandbox="" className="email-preview" />
            {data.updates.find((u) => u.id === email.id)?.status !== "SENT" && (
              <div className="email-confirm">
                <p>
                  Al confirmar, se enviará este correo a <strong>{email.to}</strong>.
                </p>
                <button
                  className="admin-primary"
                  disabled={sending || preview}
                  onClick={() => void sendEmail()}
                >
                  {sending ? "Enviando…" : "Confirmar y enviar actualización ↗"}
                </button>
              </div>
            )}
          </Dialog>
        )}
      </div>
    </AdminContext.Provider>
  );
}

function NewWork({
  categories,
  works,
  serviceId,
}: {
  categories: Category[];
  works: Work[];
  serviceId?: string;
}) {
  const [work] = useState(() => blankWork(categories, works, serviceId));
  return <WorkEditor work={work} isNew categories={categories} works={works} />;
}
