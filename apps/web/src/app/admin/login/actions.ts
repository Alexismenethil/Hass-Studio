"use server";
import { redirect } from "next/navigation";
import { sessionClient, configured } from "@/lib/server/supabase";
import { z } from "zod";
export async function login(_state: { error: string }, form: FormData) {
  if (!configured())
    return { error: "Primero configura Supabase en las variables de entorno." };
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(200) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Revisa tu correo y contraseña." };
  const db = await sessionClient();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error:
        "No pudimos iniciar sesión. Revisa tus datos o inténtalo más tarde.",
    };
  const {
    data: { user },
  } = await db.auth.getUser();
  const { data } = await db
    .from("profiles")
    .select("role")
    .eq("id", user?.id || "")
    .single();
  if (data?.role !== "ADMIN") {
    await db.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al estudio." };
  }
  redirect("/admin");
}
export async function logout() {
  const db = await sessionClient();
  await db.auth.signOut();
  redirect("/admin/login");
}
