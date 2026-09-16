import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { emailForUpdate } from "@/lib/server/email";
import { assertSameOrigin } from "@/lib/admin";
import { Resend } from "resend";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { db } = await requireAdmin();
    const { id } = await params;
    z.uuid().parse(id);
    const payload = await emailForUpdate(db, id);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Preview failed" },
      {
        status: e instanceof Error && e.message === "Unauthorized" ? 401 : 400,
      },
    );
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let claimedId: string | undefined;
  try {
    assertSameOrigin(request);
    const { db } = await requireAdmin();
    const { id } = await params;
    z.uuid().parse(id);
    const body = await request.json();
    if (body.confirm !== true)
      return NextResponse.json(
        { error: "Confirmation required" },
        { status: 400 },
      );
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      return NextResponse.json(
        { error: "Configure RESEND_API_KEY and EMAIL_FROM before sending." },
        { status: 400 },
      );
    const prepared = await emailForUpdate(db, id);
    const { data: claimed, error } = await db.rpc("claim_update", {
      update_id: id,
    });
    if (error) throw new Error("Could not reserve this update.");
    const update = claimed?.[0];
    if (!update)
      throw new Error(
        "Already sent, currently sending, or delivery requires manual verification after 23 hours.",
      );
    claimedId = id;
    let payload = update.email_payload;
    if (!payload) {
      payload = prepared;
      const saved = await db
        .from("project_updates")
        .update({ email_payload: payload })
        .eq("id", id);
      if (saved.error)
        throw new Error("Could not save the email snapshot. Nothing was sent.");
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send(payload, {
      idempotencyKey: "hass-update/" + id,
    });
    if (result.error) {
      const uncertain = ![
        "validation_error",
        "missing_required_field",
        "invalid_api_key",
        "invalid_from_address",
        "rate_limit_exceeded",
        "daily_quota_exceeded",
        "monthly_quota_exceeded",
        "restricted_api_key",
      ].includes(result.error.name);
      await db
        .from("project_updates")
        .update({
          status: uncertain ? "PENDING" : "FAILED",
          email_error: result.error.message,
        })
        .eq("id", id);
      return NextResponse.json(
        { error: result.error.message },
        { status: 502 },
      );
    }
    const saved = await db
      .from("project_updates")
      .update({
        status: "SENT",
        sent_at: new Date().toISOString(),
        provider_id: result.data?.id,
        email_error: null,
      })
      .eq("id", id);
    if (saved.error)
      return NextResponse.json(
        {
          error:
            "Provider accepted the email. Recording the result failed; retry later with the same update to reconcile.",
        },
        { status: 502 },
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          (e instanceof Error ? e.message : "Send failed") +
          (claimedId
            ? " The update is preserved. If delivery is uncertain, retry this same update after two minutes."
            : ""),
      },
      {
        status: e instanceof Error && e.message === "Unauthorized" ? 401 : 400,
      },
    );
  }
}
