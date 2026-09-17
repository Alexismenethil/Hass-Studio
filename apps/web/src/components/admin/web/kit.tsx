"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cloudinaryUrl, isVideo, pad, type Bilingual, type Locale } from "@/lib/content";
import { accept, uploadFile, type UploadKind } from "../upload";

export type Admin = {
  base: string;
  preview: boolean;
  save: (entity: string, data: unknown) => Promise<void>;
  remove: (table: "works" | "categories", id: string) => Promise<void>;
  reorder: (table: "works" | "categories", ids: string[]) => Promise<void>;
  notify: (message: string, tone?: "ok" | "error") => void;
  navigate: (path: string) => void;
};
export const AdminContext = createContext<Admin | null>(null);
export function useAdmin() {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error("AdminContext is missing");
  return admin;
}

/** Local copy of a saved value; it resets when the saved value changes. */
export function useDraft<T>(value: T, fresh = false) {
  const source = JSON.stringify(value);
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(source);
  if (seen !== source) {
    setSeen(source);
    setDraft(value);
  }
  const dirty = fresh || JSON.stringify(draft) !== source;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return { draft, setDraft, dirty, reset: () => setDraft(value) };
}

export const missingCount = (values: Bilingual[]) => ({
  es: values.filter((v) => !v.es.trim() && v.en.trim()).length,
  en: values.filter((v) => !v.en.trim() && v.es.trim()).length,
});

export function LangSwitch({
  lang,
  setLang,
  values = [],
}: {
  lang: Locale;
  setLang: (lang: Locale) => void;
  values?: Bilingual[];
}) {
  const missing = missingCount(values);
  return (
    <div className="lang-switch" role="group" aria-label="Idioma que estás editando">
      <span>Editando en</span>
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l === "es" ? "Español" : "English"}
          {missing[l] > 0 && (
            <i title={missing[l] + " textos sin traducir"}>{missing[l]}</i>
          )}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="kit-field">
      <span className="kit-label">{label}</span>
      {children}
      {hint && <small className="kit-hint">{hint}</small>}
    </label>
  );
}

export function BiField({
  label,
  hint,
  value,
  lang,
  onChange,
  rows = 1,
  placeholder,
}: {
  label: string;
  hint?: ReactNode;
  value: Bilingual;
  lang: Locale;
  onChange: (value: Bilingual) => void;
  rows?: number;
  placeholder?: string;
}) {
  const other = lang === "es" ? "en" : "es";
  const missing = !value[lang].trim() && !!value[other].trim();
  const props = {
    value: value[lang],
    placeholder: missing ? value[other] : placeholder,
    onChange: (e: { target: { value: string } }) =>
      onChange({ ...value, [lang]: e.target.value }),
  };
  return (
    <label className="kit-field">
      <span className="kit-label">
        {label}
        <em className="kit-lang">{lang.toUpperCase()}</em>
        {missing && <b className="kit-missing">Falta traducir</b>}
      </span>
      {rows > 1 ? <textarea rows={rows} {...props} /> : <input {...props} />}
      {hint && <small className="kit-hint">{hint}</small>}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="kit-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

export function Card({
  title,
  intro,
  aside,
  children,
}: {
  title: string;
  intro?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="kit-card">
      <header>
        <div>
          <h2>{title}</h2>
          {intro && <p>{intro}</p>}
        </div>
        {aside}
      </header>
      <div className="kit-card-body">{children}</div>
    </section>
  );
}

export function SaveBar({
  dirty,
  onSave,
  onReset,
  view,
  label = "Guardar y publicar",
}: {
  dirty: boolean;
  onSave: () => Promise<void>;
  onReset?: () => void;
  view?: string;
  label?: string;
}) {
  const { preview } = useAdmin();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [lastDirty, setLastDirty] = useState(dirty);
  if (lastDirty !== dirty) {
    setLastDirty(dirty);
    if (dirty && state !== "saving") setState("idle");
  }
  async function run() {
    setState("saving");
    setError("");
    try {
      await onSave();
      setState("saved");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  }
  return (
    <div className={"save-bar" + (dirty ? " is-dirty" : "") + (state === "error" ? " is-error" : "")}>
      <span className="save-status" role="status">
        <i />
        {preview
          ? "Vista de diseño: guardar está desactivado."
          : state === "saving"
            ? "Guardando…"
            : state === "error"
              ? error
              : dirty
                ? "Tienes cambios sin guardar"
                : state === "saved"
                  ? "Publicado. Ya se ve en tu web."
                  : "Todo está guardado"}
      </span>
      <div>
        {view && (
          <a className="admin-text-button" href={view} target="_blank" rel="noreferrer">
            Ver en la web ↗
          </a>
        )}
        {dirty && onReset && (
          <button
            type="button"
            className="admin-secondary"
            onClick={onReset}
            disabled={state === "saving"}
          >
            Descartar
          </button>
        )}
        <button
          type="button"
          className="admin-primary"
          onClick={() => void run()}
          disabled={!dirty || state === "saving" || preview}
        >
          {state === "saving" ? "Guardando…" : label}
        </button>
      </div>
    </div>
  );
}

export function Thumb({ src, className = "" }: { src: string; className?: string }) {
  if (!src) return <span className={"thumb thumb-empty " + className} />;
  return isVideo(src) ? (
    <video className={"thumb " + className} src={src} muted playsInline loop autoPlay preload="metadata" />
  ) : (
    // Admin previews show the uploaded file, lightly resized when Cloudinary can do it.
    <img className={"thumb " + className} src={cloudinaryUrl(src, "c_limit,f_auto,q_auto,w_640")} alt="" loading="lazy" />
  );
}

export function MediaPicker({
  label,
  hint,
  value,
  onChange,
  kind = "media",
  ratio = "16 / 10",
}: {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (url: string) => void;
  kind?: UploadKind;
  ratio?: string;
}) {
  const { preview } = useAdmin();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  async function take(file?: File) {
    if (!file) return;
    setError("");
    try {
      const result = await uploadFile(file, kind, setProgress);
      onChange(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setProgress(null);
    }
  }
  return (
    <div className="kit-field">
      <span className="kit-label">{label}</span>
      <div
        className={"picker" + (over ? " is-over" : "") + (value ? " has-value" : "")}
        style={{ aspectRatio: ratio }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!preview) void take(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <Thumb src={value} />
        ) : (
          <span className="picker-empty">
            <b>↑</b>
            {kind === "image" ? "Arrastra una imagen aquí" : "Arrastra una foto o un vídeo aquí"}
          </span>
        )}
        {progress !== null && (
          <span className="picker-progress">
            <i style={{ width: progress + "%" }} />
            Subiendo {progress}%
          </span>
        )}
        <div className="picker-actions">
          <label className="picker-button">
            {value ? "Cambiar" : "Elegir archivo"}
            <input
              type="file"
              accept={accept(kind)}
              disabled={preview || progress !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                void take(file);
              }}
            />
          </label>
          {value && (
            <button type="button" className="picker-button is-quiet" onClick={() => onChange("")}>
              Quitar
            </button>
          )}
        </div>
      </div>
      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}
      {hint && <small className="kit-hint">{hint}</small>}
    </div>
  );
}

/** Several images and videos, uploaded together and ordered by dragging. */
export function MediaManager({
  items,
  setItems,
  max = 20,
}: {
  items: string[];
  setItems: (update: (items: string[]) => string[]) => void;
  max?: number;
}) {
  const { preview } = useAdmin();
  const [uploads, setUploads] = useState<{ id: string; name: string; progress: number }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const count = useRef(items.length);
  count.current = items.length;
  async function add(files: File[]) {
    setErrors([]);
    const room = Math.max(0, max - count.current);
    if (files.length > room)
      setErrors(["Puedes tener hasta " + max + " pantallas. Se subirán " + room + "."]);
    for (const file of files.slice(0, room)) {
      const id = crypto.randomUUID();
      setUploads((list) => [...list, { id, name: file.name, progress: 0 }]);
      try {
        const result = await uploadFile(file, "media", (progress) =>
          setUploads((list) => list.map((u) => (u.id === id ? { ...u, progress } : u))),
        );
        setItems((list) => [...list, result.url]);
      } catch (e) {
        setErrors((list) => [...list, e instanceof Error ? e.message : file.name + ": error"]);
      } finally {
        setUploads((list) => list.filter((u) => u.id !== id));
      }
    }
  }
  const move = (from: number, to: number) =>
    setItems((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  return (
    <div className="media-manager">
      <div className="media-grid">
        {items.map((src, i) => (
          <figure
            key={src}
            className={"media-tile" + (dragging === i ? " is-dragging" : "")}
            draggable
            onDragStart={(e) => {
              setDragging(i);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (dragging !== null) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging !== null && dragging !== i) move(dragging, i);
              setDragging(null);
            }}
            onDragEnd={() => setDragging(null)}
          >
            <Thumb src={src} />
            <span className="media-index">{pad(i + 1)}</span>
            {isVideo(src) && <span className="media-kind">Vídeo</span>}
            <figcaption>
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Mover antes">
                ←
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label="Mover después"
              >
                →
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => setItems((list) => list.filter((item) => item !== src))}
              >
                Quitar
              </button>
            </figcaption>
          </figure>
        ))}
        {uploads.map((u) => (
          <div key={u.id} className="media-tile is-uploading">
            <span>{u.name}</span>
            <i>
              <b style={{ width: u.progress + "%" }} />
            </i>
            <small>Subiendo {u.progress}%</small>
          </div>
        ))}
        {items.length + uploads.length < max && (
          <label
            className={"media-drop" + (over ? " is-over" : "")}
            onDragOver={(e) => {
              if (dragging !== null) return;
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              if (dragging !== null) return;
              e.preventDefault();
              setOver(false);
              if (!preview) void add(Array.from(e.dataTransfer.files));
            }}
          >
            <b>+</b>
            <span>Añadir fotos o vídeos</span>
            <small>Puedes arrastrar varios a la vez</small>
            <input
              type="file"
              multiple
              accept={accept("media")}
              disabled={preview}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.currentTarget.value = "";
                void add(files);
              }}
            />
          </label>
        )}
      </div>
      {errors.map((error, i) => (
        <small key={i} className="form-error" role="alert">
          {error}
        </small>
      ))}
    </div>
  );
}

export function LaptopPreview({ src }: { src: string }) {
  return (
    <div className="laptop-preview">
      <img src="/images/laptop-frontal.webp" alt="" />
      <div className="laptop-preview-screen">
        {src ? <Thumb src={src} /> : <span>Sin pantallas todavía</span>}
      </div>
    </div>
  );
}
