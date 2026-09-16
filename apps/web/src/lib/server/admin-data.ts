import "server-only";
import { requireAdmin } from "./auth";
export async function getAdminData() {
  const { db } = await requireAdmin();
  const tables = [
    "clients",
    "projects",
    "milestones",
    "project_updates",
    "portfolio_entries",
    "categories",
    "site_settings",
  ] as const;
  const out = await Promise.all(tables.map((t) => db.from(t).select("*")));
  for (const r of out)
    if (r.error) throw new Error("Unable to load administration data.");
  return {
    clients: out[0].data ?? [],
    projects: out[1].data ?? [],
    milestones: out[2].data ?? [],
    updates: out[3].data ?? [],
    works: out[4].data ?? [],
    categories: out[5].data ?? [],
    settings: out[6].data?.[0]?.data,
  };
}
