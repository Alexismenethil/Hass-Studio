import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import {
  assertSameOrigin,
  clientSchema,
  projectSchema,
  milestoneSchema,
  updateSchema,
} from "@/lib/admin";
import { settingsSchema, categorySchema, workSchema } from "@/lib/content";
const tables = {
  works: "portfolio_entries",
  categories: "categories",
  milestones: "milestones",
} as const;
const deleteSchema = z.object({
  table: z.enum(["works", "categories", "milestones"]),
  id: z.string().min(1).max(120),
});
const reorderSchema = z.object({
  table: z.enum(["works", "categories"]),
  ids: z.array(z.string().min(1).max(120)).max(200),
});
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { db } = await requireAdmin();
    const body = await request.json();
    let result;
    switch (body.entity) {
      case "settings":
        result = await db.from("site_settings").upsert({
          id: 1,
          data: settingsSchema.parse(body.data),
          updated_at: new Date().toISOString(),
        });
        break;
      case "categories":
        result = await db
          .from("categories")
          .upsert(categorySchema.parse(body.data));
        break;
      case "works":
        result = await db
          .from("portfolio_entries")
          .upsert(workSchema.parse(body.data));
        break;
      case "delete": {
        const { table, id } = deleteSchema.parse(body.data);
        result = await db.from(tables[table]).delete().eq("id", id);
        if (result.error?.code === "23503")
          throw new Error(
            "Este servicio todavía tiene trabajos. Muévelos a otro servicio o elimínalos primero.",
          );
        break;
      }
      case "reorder": {
        const { table, ids } = reorderSchema.parse(body.data);
        const results = await Promise.all(
          ids.map((id, sort_order) =>
            db.from(tables[table]).update({ sort_order }).eq("id", id),
          ),
        );
        result = results.find((r) => r.error) ?? results[0] ?? { error: null };
        break;
      }
      case "clients":
        result = await db.from("clients").upsert(clientSchema.parse(body.data));
        break;
      case "projects":
        result = await db.from("projects").upsert({
          ...projectSchema.parse(body.data),
          updated_at: new Date().toISOString(),
        });
        break;
      case "milestones":
        result = await db
          .from("milestones")
          .upsert(milestoneSchema.parse(body.data));
        break;
      case "updates": {
        const data = updateSchema.parse(body.data);
        const { data: existing, error } = await db
          .from("project_updates")
          .select("status")
          .eq("id", data.id)
          .maybeSingle();
        if (error) throw error;
        if (existing && existing.status !== "DRAFT")
          throw new Error(
            "An attempted or sent update is read-only. Create a new update.",
          );
        result = existing
          ? await db
              .from("project_updates")
              .update(data)
              .eq("id", data.id)
              .eq("status", "DRAFT")
              .select("id")
              .single()
          : await db.from("project_updates").insert(data);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
    }
    if (result.error)
      throw new Error(
        result.error.code === "23505"
          ? "Esa dirección (slug) ya existe. Elige otra."
          : "No se pudo guardar. Revisa los campos e inténtalo de nuevo.",
      );
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? "Hay campos con un formato no válido: " +
          e.issues
            .map((i) => i.path.join(".") || i.message)
            .slice(0, 4)
            .join(", ")
        : e instanceof Error
          ? e.message
          : "Unable to save";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
