import { redirect } from "next/navigation";
import { getAdminData } from "@/lib/server/admin-data";
import { AdminApp } from "@/components/admin/admin-app";
export const dynamic = "force-dynamic";
const moved: Record<string, string> = {
  portfolio: "/admin/web/servicios",
  categories: "/admin/web/servicios",
  settings: "/admin/web/estudio",
};
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { section = [] } = await params;
  if (moved[section[0]]) redirect(moved[section[0]]);
  const { servicio } = await searchParams;
  const data = await getAdminData();
  return (
    <AdminApp
      data={data}
      section={section}
      query={{ servicio: typeof servicio === "string" ? servicio : undefined }}
    />
  );
}
