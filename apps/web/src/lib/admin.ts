import { z } from "zod";
import { safeUrl, mediaUrl } from "./content";
export const clientSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.email(),
  company: z.string().max(120),
});
const date = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .nullable()
  .transform((v) => v || null);
export const projectSchema = z.object({
  id: z.uuid(),
  client_id: z.uuid().nullable(),
  name: z.string().min(1).max(150),
  description: z.string().max(5000),
  status: z.enum([
    "PLANNING",
    "IN_PROGRESS",
    "REVIEW",
    "PAUSED",
    "COMPLETED",
    "CANCELLED",
  ]),
  progress: z.number().int().min(0).max(100),
  start_date: date,
  estimated_delivery_date: date,
  archived: z.boolean(),
});
export const milestoneSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  title: z.string().min(1).max(200),
  due_date: date,
  completed: z.boolean(),
});
export const updateSchema = z.object({
  id: z.uuid(),
  project_id: z.uuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(12000),
  progress: z.number().int().min(0).max(100),
  preview_url: safeUrl,
  language: z.enum(["en", "es"]),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        path: z.string().regex(/^[a-f0-9-]+\/[a-f0-9-]+\.[a-z0-9]+$/),
        type: z.string().max(100),
      }),
    )
    .max(8),
});
export type Client = z.infer<typeof clientSchema>;
export type Project = z.infer<typeof projectSchema> & { created_at?: string };
export type Milestone = z.infer<typeof milestoneSchema>;
export type Update = z.infer<typeof updateSchema> & {
  status: "DRAFT" | "PENDING" | "SENT" | "FAILED";
  created_at: string;
  sent_at?: string;
  email_error?: string;
  provider_id?: string;
  first_attempt_at?: string;
  locked_at?: string;
  email_payload?: unknown;
};
export const statusLabels: Record<string, string> = {
  PLANNING: "Planificación",
  IN_PROGRESS: "En desarrollo",
  REVIEW: "En revisión",
  PAUSED: "Pausado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  SENT: "Enviado",
  FAILED: "Falló",
};
export function canRetryPending(
  firstAttempt: string | null,
  lockedAt: string | null,
  now = Date.now(),
) {
  return (
    !!firstAttempt &&
    !!lockedAt &&
    now - Date.parse(firstAttempt) < 23 * 3600000 &&
    now - Date.parse(lockedAt) > 120000
  );
}
export function assertSameOrigin(request: Request) {
  const url = new URL(request.url);
  // Next can use its internal listening host in request.url. The Host header
  // retains the browser-facing authority; browsers cannot forge that header.
  const authority = request.headers.get("host") || url.host;
  const expected = url.protocol + "//" + authority;
  if (request.headers.get("origin") !== expected)
    throw new Error("Invalid origin");
}
export function publicMediaValid(url: string) {
  return mediaUrl.safeParse(url).success;
}
