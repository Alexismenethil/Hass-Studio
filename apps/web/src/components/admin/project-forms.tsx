"use client";
import { useState } from "react";
import {
  type Project,
  type Client,
  type Update,
  type Milestone,
  statusLabels,
} from "@/lib/admin";
import { Form, Field, type Save } from "./form-fields";
import { UploadField } from "./upload";
export function ClientForm({
  value,
  save,
  preview,
}: {
  value: Client;
  save: Save;
  preview: boolean;
}) {
  const [v, set] = useState(value);
  return (
    <Form preview={preview} onSave={() => save("clients", v)}>
      <Field label="Nombre">
        <input
          required
          value={v.name}
          onChange={(e) => set({ ...v, name: e.target.value })}
        />
      </Field>
      <Field label="Correo">
        <input
          required
          type="email"
          value={v.email}
          onChange={(e) => set({ ...v, email: e.target.value })}
        />
      </Field>
      <Field label="Empresa">
        <input
          value={v.company}
          onChange={(e) => set({ ...v, company: e.target.value })}
        />
      </Field>
    </Form>
  );
}
export function ProjectForm({
  value,
  save,
  clients,
  preview,
}: {
  value: Project;
  save: Save;
  clients: Client[];
  preview: boolean;
}) {
  const [v, set] = useState(value);
  return (
    <Form preview={preview} onSave={() => save("projects", v)}>
      <Field label="Nombre del proyecto">
        <input
          value={v.name}
          required
          onChange={(e) => set({ ...v, name: e.target.value })}
        />
      </Field>
      <Field label="Cliente">
        <select
          value={v.client_id || ""}
          onChange={(e) => set({ ...v, client_id: e.target.value || null })}
        >
          <option value="">Sin asignar</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Descripción interna">
        <textarea
          value={v.description}
          rows={4}
          onChange={(e) => set({ ...v, description: e.target.value })}
        />
      </Field>
      <div className="form-grid">
        <Field label="Estado">
          <select
            value={v.status}
            onChange={(e) =>
              set({ ...v, status: e.target.value as Project["status"] })
            }
          >
            {[
              "PLANNING",
              "IN_PROGRESS",
              "REVIEW",
              "PAUSED",
              "COMPLETED",
              "CANCELLED",
            ].map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Progreso (%)">
          <input
            type="number"
            min="0"
            max="100"
            required
            value={v.progress}
            onChange={(e) => set({ ...v, progress: Number(e.target.value) })}
          />
        </Field>
        <Field label="Fecha de inicio">
          <input
            type="date"
            value={v.start_date || ""}
            onChange={(e) => set({ ...v, start_date: e.target.value })}
          />
        </Field>
        <Field label="Entrega estimada">
          <input
            type="date"
            value={v.estimated_delivery_date || ""}
            onChange={(e) =>
              set({ ...v, estimated_delivery_date: e.target.value })
            }
          />
        </Field>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={v.archived}
          onChange={(e) => set({ ...v, archived: e.target.checked })}
        />
        Archivar proyecto
      </label>
    </Form>
  );
}
export function MilestoneForm({
  value,
  save,
  preview,
}: {
  value: Milestone;
  save: Save;
  preview: boolean;
}) {
  const [v, set] = useState(value);
  return (
    <Form preview={preview} onSave={() => save("milestones", v)}>
      <Field label="Hito">
        <input
          required
          value={v.title}
          onChange={(e) => set({ ...v, title: e.target.value })}
        />
      </Field>
      <Field label="Fecha prevista">
        <input
          type="date"
          value={v.due_date || ""}
          onChange={(e) => set({ ...v, due_date: e.target.value })}
        />
      </Field>
    </Form>
  );
}
export function UpdateForm({
  value,
  save,
  preview,
}: {
  value: Update;
  save: Save;
  preview: boolean;
}) {
  const [v, set] = useState(value);
  return (
    <Form preview={preview} onSave={() => save("updates", v)}>
      <Field label="Título de la actualización">
        <input
          required
          value={v.title}
          onChange={(e) => set({ ...v, title: e.target.value })}
        />
      </Field>
      <Field label="Mensaje para tu cliente">
        <textarea
          required
          rows={8}
          value={v.message}
          onChange={(e) => set({ ...v, message: e.target.value })}
          placeholder="Hoy terminamos…"
        />
      </Field>
      <div className="form-grid">
        <Field label="Progreso (%)">
          <input
            type="number"
            min="0"
            max="100"
            value={v.progress}
            onChange={(e) => set({ ...v, progress: Number(e.target.value) })}
          />
        </Field>
        <Field label="Idioma del correo">
          <select
            value={v.language}
            onChange={(e) =>
              set({ ...v, language: e.target.value as "en" | "es" })
            }
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </Field>
      </div>
      <Field label="Enlace de preview (opcional)">
        <input
          type="url"
          placeholder="https://"
          value={v.preview_url}
          onChange={(e) => set({ ...v, preview_url: e.target.value })}
        />
      </Field>
      <UploadField
        label="Capturas y archivos privados"
        privateFile
        disabled={preview || v.attachments.length >= 8}
        onChange={(_url, file) => {
          if (file) set({ ...v, attachments: [...v.attachments, file] });
        }}
      />
      {v.attachments.map((f, i) => (
        <div className="attachment-item" key={f.path}>
          {f.name}
          <button
            type="button"
            onClick={() =>
              set({
                ...v,
                attachments: v.attachments.filter((_, n) => n !== i),
              })
            }
          >
            Quitar
          </button>
        </div>
      ))}
      <p className="form-hint">
        Guardar crea un borrador. Podrás previsualizar y confirmar el envío
        desde el historial.
      </p>
    </Form>
  );
}
