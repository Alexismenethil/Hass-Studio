import "server-only";
import { cache } from "react";
import initial from "../initial-data.json";
import { settingsSchema, categorySchema, workSchema } from "../content";
import { configured, publicClient } from "./supabase";
export const getContent = cache(async () => {
  if (!configured())
    return {
      settings: settingsSchema.parse(initial.settings),
      categories: initial.categories.map((v) => categorySchema.parse(v)),
      works: initial.works.map((v) => workSchema.parse(v)),
      preview: true,
    };
  const db = publicClient();
  const [s, c, w] = await Promise.all([
    db.from("site_settings").select("data").eq("id", 1).single(),
    db.from("categories").select("*").order("sort_order"),
    db
      .from("portfolio_entries")
      .select(
        "id,slug,title,category_id,year,cover,video,url,description,challenge,approach,services,gallery,featured,published,concept,kind,sort_order",
      )
      .eq("published", true)
      .order("sort_order"),
  ]);
  if (s.error || c.error || w.error)
    throw new Error(
      "Content is unavailable. Check Supabase migrations and access policies.",
    );
  return {
    settings: settingsSchema.parse(s.data.data),
    categories: (c.data ?? []).map((v) => categorySchema.parse(v)),
    works: (w.data ?? []).map((v) => workSchema.parse(v)),
    preview: false,
  };
});
