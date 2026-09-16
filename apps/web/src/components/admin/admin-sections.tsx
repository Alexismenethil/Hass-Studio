"use client";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import Link from "next/link";
import type { AdminData, Editor } from "./admin-app";
import {
  type Project,
  type Update,
  type Milestone,
  statusLabels,
} from "@/lib/admin";
import type { Save } from "./forms";
const formatDate = (v?: string) =>
  v
    ? new Intl.DateTimeFormat("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(v))
    : "—";
type Props = {
  page: string;
  data: AdminData;
  detail?: Project;
  active: Project[];
  upcoming: Milestone[];
  updates: Update[];
  preview: boolean;
  newProject: () => void;
  showArchive: boolean;
  setShowArchive: Dispatch<SetStateAction<boolean>>;
  updateList: (items: Update[]) => ReactNode;
  setEditor: Dispatch<SetStateAction<Editor | null>>;
  newUpdate: (p: Project) => void;
  safeSave: (entity: string, value: unknown) => void;
  save: Save;
};
export function AdminSections({
  page,
  data,
  detail,
  active,
  upcoming,
  updates,
  preview,
  newProject,
  showArchive,
  setShowArchive,
  updateList,
  setEditor,
  newUpdate,
  safeSave,
  save,
}: Props) {
  return (
    <>
      {page === "" && (
        <>
          <div className="stat-grid">
            {[
              ["Proyectos activos", active.length, "En movimiento"],
              [
                "Completados",
                data.projects.filter((p) => p.status === "COMPLETED").length,
                "Ideas hechas realidad",
              ],
              ["Clientes", data.clients.length, "Relaciones que importan"],
              [
                "Por comunicar",
                updates.filter(
                  (u) => u.status === "DRAFT" || u.status === "FAILED",
                ).length,
                "Avances esperando salir",
              ],
            ].map(([label, num, sub]) => (
              <div className="stat-card" key={label}>
                <span>{label}</span>
                <strong>{num.toString().padStart(2, "0")}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>
          <div className="admin-overview-grid">
            <section className="admin-panel">
              <div className="panel-heading">
                <h2>Proyectos en movimiento</h2>
                <button onClick={newProject}>+ Crear</button>
              </div>
              {active.length ? (
                active.map((p) => (
                  <Link
                    className="project-mini"
                    href={"/admin/projects/" + p.id}
                    key={p.id}
                  >
                    <div>
                      <h3>{p.name}</h3>
                      <small>
                        {data.clients.find((c) => c.id === p.client_id)?.name}
                      </small>
                    </div>
                    <span>{p.progress}% ↗</span>
                  </Link>
                ))
              ) : (
                <div className="admin-empty">
                  <span>◈</span>
                  <h3>Un espacio para tus próximos proyectos.</h3>
                  <p>Crea tu primer proyecto y comienza a darle forma.</p>
                  <button className="admin-secondary" onClick={newProject}>
                    Crear proyecto ↗
                  </button>
                </div>
              )}
            </section>
            <section className="admin-panel">
              <div className="panel-heading">
                <h2>Próximos hitos</h2>
                <span>↗</span>
              </div>
              {upcoming.slice(0, 5).map((m) => (
                <div className="milestone-mini" key={m.id}>
                  <span className="milestone-circle" />
                  <div>
                    {m.title}
                    <small>{formatDate(m.due_date || undefined)}</small>
                  </div>
                </div>
              ))}
              {!upcoming.length && (
                <p className="panel-empty">
                  Tus próximos pasos aparecerán aquí.
                </p>
              )}
              <div className="admin-note">
                <span className="admin-overline">A LITTLE REMINDER</span>
                <p>
                  Las cosas extraordinarias
                  <br />
                  se construyen <em>con cuidado.</em>
                </p>
              </div>
            </section>
          </div>
          <section className="admin-panel">
            <div className="panel-heading">
              <h2>Lo último en tu estudio</h2>
            </div>
            {updateList(updates.slice(0, 3))}
          </section>
        </>
      )}
      {page === "projects" && !detail && (
        <>
          <label className="check archive-toggle">
            <input
              type="checkbox"
              checked={showArchive}
              onChange={(e) => setShowArchive(e.target.checked)}
            />
            Mostrar archivados
          </label>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Entrega</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.projects
                  .filter((p) => showArchive || !p.archived)
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={"/admin/projects/" + p.id}>
                          {p.name}
                          {p.archived ? " (archivado)" : ""}
                        </Link>
                      </td>
                      <td>
                        {data.clients.find((c) => c.id === p.client_id)?.name ||
                          "—"}
                      </td>
                      <td>
                        <span className="badge">{statusLabels[p.status]}</span>
                      </td>
                      <td>
                        <div className="table-progress">
                          <span style={{ width: p.progress + "%" }} />
                        </div>
                        {p.progress}%
                      </td>
                      <td>
                        {formatDate(p.estimated_delivery_date || undefined)}
                      </td>
                      <td>
                        <Link href={"/admin/projects/" + p.id}>Abrir ↗</Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!data.projects.length && (
              <div className="admin-empty">
                <h3>Tu primer proyecto está por empezar.</h3>
                <p>Añádelo para gestionar sus avances.</p>
              </div>
            )}
          </div>
        </>
      )}
      {detail && (
        <>
          <div className="project-overview">
            <div>
              <span className="badge">{statusLabels[detail.status]}</span>
              <p>{detail.description}</p>
              <small>
                Entrega prevista ·{" "}
                {formatDate(detail.estimated_delivery_date || undefined)}
              </small>
            </div>
            <div className="big-progress">
              <strong>
                {detail.progress}
                <small>%</small>
              </strong>
              <div>
                <span style={{ width: detail.progress + "%" }} />
              </div>
            </div>
          </div>
          <div className="admin-overview-grid">
            <section className="admin-panel">
              <div className="panel-heading">
                <h2>Historial del proyecto</h2>
                <button
                  className="admin-primary"
                  onClick={() => newUpdate(detail)}
                >
                  + Nueva actualización
                </button>
              </div>
              {updateList(updates.filter((u) => u.project_id === detail.id))}
              <div className="timeline-origin">
                ◦ Proyecto creado · {formatDate(detail.created_at)}
              </div>
            </section>
            <section className="admin-panel">
              <div className="panel-heading">
                <h2>Hitos</h2>
                <button
                  onClick={() =>
                    setEditor({
                      type: "milestone",
                      value: {
                        id: crypto.randomUUID(),
                        project_id: detail.id,
                        title: "",
                        due_date: null,
                        completed: false,
                      },
                    })
                  }
                >
                  + Añadir
                </button>
              </div>
              {data.milestones
                .filter((m) => m.project_id === detail.id)
                .map((m) => (
                  <label className="milestone-mini" key={m.id}>
                    <input
                      type="checkbox"
                      checked={m.completed}
                      disabled={preview}
                      onChange={(e) =>
                        safeSave("milestones", {
                          ...m,
                          completed: e.target.checked,
                        })
                      }
                    />
                    <div>
                      {m.title}
                      <small>{formatDate(m.due_date || undefined)}</small>
                    </div>
                  </label>
                ))}
            </section>
          </div>
        </>
      )}
      {page === "clients" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Correo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.company || "—"}</td>
                  <td>{c.email}</td>
                  <td>
                    <button
                      onClick={() => setEditor({ type: "client", value: c })}
                    >
                      Editar ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.clients.length && (
            <div className="admin-empty">
              <h3>Todo buen proyecto empieza con alguien.</h3>
              <p>Añade un cliente para enviarle sus avances.</p>
            </div>
          )}
        </div>
      )}
      {page === "updates" && (
        <section className="admin-panel">{updateList(updates)}</section>
      )}
    </>
  );
}
