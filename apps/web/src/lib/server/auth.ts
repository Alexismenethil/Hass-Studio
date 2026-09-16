import "server-only";
import { sessionClient, configured } from "./supabase";
export async function requireAdmin() {
  if (!configured()) throw new Error("Unauthorized");
  const db = await sessionClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (data?.role !== "ADMIN") throw new Error("Unauthorized");
  return { db, user };
}
