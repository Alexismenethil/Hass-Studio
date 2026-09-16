import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
export default async function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }
  return children;
}
