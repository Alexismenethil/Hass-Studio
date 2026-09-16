import "server-only";
import { render } from "@react-email/render";
import { ProjectUpdateEmail } from "@hass/emails";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function emailForUpdate(db: SupabaseClient, id: string) {
  const { data: u, error } = await db
    .from("project_updates")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !u) throw new Error("Update not found");
  if (u.email_payload)
    return u.email_payload as {
      html: string;
      to: string;
      subject: string;
      from: string;
    };
  const { data: p } = await db
    .from("projects")
    .select("name,client_id")
    .eq("id", u.project_id)
    .single();
  if (!p?.client_id) throw new Error("Assign a client to the project first.");
  const { data: c } = await db
    .from("clients")
    .select("email")
    .eq("id", p.client_id)
    .single();
  if (!c?.email) throw new Error("Client email is missing.");
  const { data: s } = await db
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .single();
  const files = [];
  for (const f of u.attachments ?? []) {
    const { data, error } = await db.storage
      .from("client-files")
      .createSignedUrl(f.path, 7 * 24 * 3600);
    if (error) throw new Error("Unable to prepare attachment.");
    files.push({ name: f.name, url: data.signedUrl });
  }
  const html = await render(
    ProjectUpdateEmail({
      brand: s?.data.brand || "HASS Studio",
      project: p.name,
      title: u.title,
      message: u.message,
      progress: u.progress,
      language: u.language,
      previewUrl: u.preview_url,
      files,
    }),
  );
  return {
    html,
    to: c.email,
    subject: p.name + " — " + u.title,
    from: process.env.EMAIL_FROM || "",
  };
}
