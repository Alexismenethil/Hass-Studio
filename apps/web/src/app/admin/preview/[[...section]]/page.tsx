import { notFound } from "next/navigation";
import initial from "@/lib/initial-data.json";
import { settingsSchema, categorySchema, workSchema } from "@/lib/content";
import { AdminApp } from "@/components/admin/admin-app";
export default async function Preview({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ servicio?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { section = [] } = await params;
  const { servicio } = await searchParams;
  return (
    <AdminApp
      data={{
        settings: settingsSchema.parse(initial.settings),
        categories: initial.categories.map((c) => categorySchema.parse(c)),
        works: initial.works.map((w) => workSchema.parse(w)),
        clients: [],
        projects: [],
        milestones: [],
        updates: [],
      }}
      section={section}
      query={{ servicio: typeof servicio === "string" ? servicio : undefined }}
      preview
    />
  );
}
