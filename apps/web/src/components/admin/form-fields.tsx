"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import type { Bilingual } from "@/lib/content";
export type Save = (entity: string, data: unknown) => Promise<void>;
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function BilingualField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
}) {
  return (
    <div className="bilingual-field">
      <span>{label}</span>
      <div>
        <Field label="EN">
          <textarea
            aria-label={label + " — English"}
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            rows={value.en.length > 150 ? 4 : 2}
          />
        </Field>
        <Field label="ES">
          <textarea
            aria-label={label + " — Español"}
            value={value.es}
            onChange={(e) => onChange({ ...value, es: e.target.value })}
            rows={value.es.length > 150 ? 4 : 2}
          />
        </Field>
      </div>
    </div>
  );
}
export function Form({
  children,
  onSave,
  preview = false,
}: {
  children: ReactNode;
  onSave: () => Promise<void>;
  preview?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-form">
      {children}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <span>Los cambios se publican al guardar.</span>
        <button className="admin-primary" disabled={busy || preview}>
          {busy ? "Guardando…" : "Guardar cambios ↗"}
        </button>
      </div>
    </form>
  );
}
