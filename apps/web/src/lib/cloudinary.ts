import { createHash } from "node:crypto";
import { cloudinaryEager } from "./content";

export type CloudinaryResource = "image" | "video";

/** Upload API signature: sorted name=value pairs, the secret appended, SHA-1. */
export function signCloudinary(params: Record<string, string | number>, secret: string) {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== "" && params[key] !== undefined)
    .sort()
    .map((key) => key + "=" + params[key])
    .join("&");
  return createHash("sha1").update(payload + secret).digest("hex");
}

export function cloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && secret ? { cloudName, apiKey, secret } : null;
}

/** Signed parameters for one browser upload. Videos get their web renditions prepared right away. */
export function uploadParams(resource: CloudinaryResource, now = Date.now()) {
  const params: Record<string, string | number> = {
    asset_folder: "hass-studio",
    timestamp: Math.floor(now / 1000),
  };
  if (resource === "video") {
    params.eager = cloudinaryEager;
    params.eager_async = "true";
  }
  return params;
}
