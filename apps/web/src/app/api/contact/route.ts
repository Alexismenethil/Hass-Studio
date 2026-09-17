import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/admin";
import { contactSchema, type ContactMessage } from "@/lib/content";
import { getContent } from "@/lib/server/content";

// Best effort per server instance: a few messages per visitor every ten minutes.
const recent = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  recent.set(ip, list);
  if (recent.size > 5000) recent.clear();
  return list.length > 5;
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function email(message: ContactMessage, brand: string) {
  const rows = [
    ["Nombre", message.name],
    ["Email", message.email],
    ["WhatsApp / teléfono", message.phone],
    ["Servicio", message.service],
    ["Idioma de la web", message.locale === "es" ? "Español" : "English"],
  ].filter(([, value]) => value);
  const html = `<!doctype html><html><body style="margin:0;background:#f3f0e8;font-family:Helvetica,Arial,sans-serif;color:#262a22">
<div style="max-width:560px;margin:0 auto;padding:40px 28px">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#7b7d72">${escape(brand)} · Nuevo mensaje</p>
<h1 style="margin:0 0 28px;font-family:Georgia,serif;font-weight:400;font-size:34px;line-height:1.1">${escape(message.name)} quiere hablar contigo</h1>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid #dcd8cc;color:#7b7d72;width:40%">${label}</td><td style="padding:10px 0;border-top:1px solid #dcd8cc">${escape(value)}</td></tr>`,
    )
    .join("")}</table>
<p style="margin:28px 0 0;padding:22px;background:#fff;border-radius:14px;font-size:15px;line-height:1.6;white-space:pre-wrap">${escape(message.message)}</p>
<p style="margin:26px 0 0;font-size:13px;color:#7b7d72">Responde a este correo para escribirle directamente.</p>
</div></body></html>`;
  const text = rows.map(([label, value]) => label + ": " + value).join("\n") + "\n\n" + message.message;
  return { html, text };
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const message = contactSchema.parse(await request.json());
    // Trap field filled in, or sent faster than a person can type: accept quietly, send nothing.
    if (message.website || Date.now() - message.startedAt < 2500) return NextResponse.json({ ok: true });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (limited(ip))
      return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
    const { settings } = await getContent();
    const to = process.env.CONTACT_EMAIL || settings.email;
    const key = process.env.RESEND_API_KEY;
    if (!to || !key) {
      console.error("Contact form: set RESEND_API_KEY and CONTACT_EMAIL (or the public email in the panel).");
      return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
    }
    const { html, text } = email(message, settings.brand);
    const result = await new Resend(key).emails.send({
      from: process.env.EMAIL_FROM || settings.brand + " <onboarding@resend.dev>",
      to,
      replyTo: message.email,
      subject: "Nuevo mensaje de " + message.name + (message.service ? " · " + message.service : ""),
      html,
      text,
    });
    if (result.error) {
      console.error("Contact form:", result.error.message);
      return NextResponse.json({ error: "Could not send." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const invalid = e instanceof z.ZodError || (e instanceof Error && e.message === "Invalid origin");
    return NextResponse.json({ error: invalid ? "Invalid message." : "Could not send." }, { status: invalid ? 400 : 500 });
  }
}
