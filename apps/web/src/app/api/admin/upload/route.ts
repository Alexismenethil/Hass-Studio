import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { assertSameOrigin } from "@/lib/admin";
import { cloudinaryConfig, signCloudinary, uploadParams } from "@/lib/cloudinary";

/** Signs a direct browser upload to Cloudinary. The secret never leaves the server. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    const { resource } = z
      .object({ resource: z.enum(["image", "video"]) })
      .parse(await request.json());
    const config = cloudinaryConfig();
    if (!config)
      return NextResponse.json(
        { error: "Cloudinary no está configurado en el servidor." },
        { status: 503 },
      );
    const params = uploadParams(resource);
    return NextResponse.json(
      {
        cloudName: config.cloudName,
        apiKey: config.apiKey,
        params,
        signature: signCloudinary(params, config.secret),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo preparar la subida.";
    return NextResponse.json(
      { error: message === "Unauthorized" ? "Tu sesión expiró. Inicia sesión de nuevo." : message },
      { status: message === "Unauthorized" ? 401 : 400 },
    );
  }
}
