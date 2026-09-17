"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Upload } from "tus-js-client";

export type UploadKind = "image" | "video" | "media" | "private";
const MB = 1024 * 1024;
const images = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const videos = ["video/mp4", "video/webm"];
/** Public media goes to Cloudinary when it is configured; client files always stay private in Supabase. */
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const toCloud = (kind: UploadKind) => !!cloudName && kind !== "private";
function types(kind: UploadKind) {
  const moving = toCloud(kind) ? [...videos, "video/quicktime"] : videos;
  if (kind === "image") return images;
  if (kind === "video") return moving;
  if (kind === "media") return [...images, ...moving];
  return [...images, ...videos, "application/pdf"];
}
export const accept = (kind: UploadKind) => types(kind).join(",");
const ext: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

/** Uploads a file and returns its public URL (or the private path for client files). */
export async function uploadFile(
  file: File,
  kind: UploadKind,
  onProgress: (percent: number) => void = () => {},
) {
  if (!types(kind).includes(file.type))
    throw new Error(
      file.name +
        ": formato no permitido. Usa " +
        (kind === "video"
          ? "MP4, WebM o MOV."
          : kind === "image"
            ? "JPG, PNG, WebP o AVIF."
            : "JPG, PNG, WebP, AVIF, MP4, WebM o MOV."),
    );
  const video = file.type.startsWith("video/");
  if (toCloud(kind) && !cloudBlocked) {
    if (video && file.size > 100 * MB)
      throw new Error(
        file.name + ": los vídeos deben pesar menos de 100 MB. Comprímelo (por ejemplo con HandBrake) y vuelve a intentarlo.",
      );
    // Cloudinary's free plan takes images up to 10 MB; heavier captures go to Supabase.
    if (video || file.size <= 10 * MB) {
      try {
        return await uploadToCloudinary(file, video ? "video" : "image", onProgress);
      } catch (e) {
        if (!(e instanceof CloudUnavailable)) throw e;
        // Keep the panel working: files Supabase accepts go there until Cloudinary is fixed.
        cloudBlocked = true;
        console.warn("Cloudinary unavailable, using Supabase Storage:", e.message);
        if (!ext[file.type] || file.size > 50 * MB)
          throw new Error(
            file.name + ": Cloudinary no permite subir archivos con esta clave. Mientras tanto usa MP4 o WebM de menos de 50 MB.",
          );
      }
    }
  }
  return uploadToSupabase(file, kind, onProgress);
}

/** Cloudinary is not configured or its key cannot upload. */
class CloudUnavailable extends Error {}
let cloudBlocked = false;

type Signed = { cloudName: string; apiKey: string; signature: string; params: Record<string, string | number> };

async function uploadToCloudinary(file: File, resource: "image" | "video", onProgress: (percent: number) => void) {
  const response = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource }),
  });
  const signed = (await response.json().catch(() => ({}))) as Signed & { error?: string };
  if (response.status === 503) throw new CloudUnavailable(signed.error || "not configured");
  if (!response.ok) throw new Error(signed.error || "No se pudo preparar la subida.");
  const endpoint = "https://api.cloudinary.com/v1_1/" + signed.cloudName + "/" + resource + "/upload";
  // Large videos travel in 20 MB pieces, so a slow connection does not have to start over.
  const chunk = 20 * MB;
  const chunked = file.size > chunk;
  const uploadId = crypto.randomUUID();
  onProgress(0);
  for (let start = 0; ; start += chunk) {
    const end = Math.min(file.size, start + chunk);
    const body = new FormData();
    body.append("file", chunked ? file.slice(start, end, file.type) : file, file.name);
    body.append("api_key", signed.apiKey);
    body.append("signature", signed.signature);
    Object.entries(signed.params).forEach(([key, value]) => body.append(key, String(value)));
    const headers: Record<string, string> = chunked
      ? { "X-Unique-Upload-Id": uploadId, "Content-Range": "bytes " + start + "-" + (end - 1) + "/" + file.size }
      : {};
    const result = await send(endpoint, body, headers, (part) =>
      onProgress(Math.min(99, Math.round(((start + part * (end - start)) / file.size) * 100))),
    );
    if (end >= file.size) {
      if (typeof result.secure_url !== "string") throw new Error(file.name + ": Cloudinary no devolvió la dirección.");
      onProgress(100);
      return { url: result.secure_url, file: { name: file.name, path: result.secure_url, type: file.type } };
    }
  }
}

function send(
  url: string,
  body: FormData,
  headers: Record<string, string>,
  progress: (part: number) => void,
  attempt = 0,
): Promise<{ secure_url?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) progress(e.loaded / e.total);
    };
    const retry = (reason: string) => {
      if (attempt < 3)
        window.setTimeout(() => send(url, body, headers, progress, attempt + 1).then(resolve, reject), 1000 * (attempt + 1));
      else reject(new Error(reason));
    };
    xhr.onerror = () => retry("Se perdió la conexión durante la subida. Inténtalo de nuevo.");
    xhr.onload = () => {
      let data: { secure_url?: string; error?: { message?: string } } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else if (xhr.status >= 500) retry("Cloudinary no respondió. Inténtalo de nuevo en un momento.");
      else if (xhr.status === 401 || xhr.status === 403)
        reject(new CloudUnavailable(data.error?.message || "error " + xhr.status));
      else reject(new Error("Cloudinary rechazó el archivo: " + (data.error?.message || "error " + xhr.status)));
    };
    xhr.send(body);
  });
}

async function uploadToSupabase(file: File, kind: UploadKind, onProgress: (percent: number) => void) {
  if (file.size > 50 * MB) throw new Error(file.name + ": debe pesar menos de 50 MB.");
  if (!ext[file.type]) throw new Error(file.name + ": para este formato hace falta Cloudinary.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Conecta Supabase para subir archivos.");
  const db = createBrowserClient(url, key);
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
  const bucket = kind === "private" ? "client-files" : "public-media";
  const path = user.id + "/" + crypto.randomUUID() + "." + ext[file.type];
  onProgress(0);
  if (file.size > 6 * MB) {
    const {
      data: { session },
    } = await db.auth.getSession();
    if (!session) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
    await new Promise<void>((resolve, reject) => {
      const task = new Upload(file, {
        endpoint: url + "/storage/v1/upload/resumable",
        retryDelays: [0, 1000, 3000, 5000],
        headers: { authorization: "Bearer " + session.access_token, apikey: key },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: bucket,
          objectName: path,
          contentType: file.type,
          cacheControl: "31536000",
        },
        chunkSize: 6 * MB,
        onError: reject,
        onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(),
      });
      task.start();
    });
  } else {
    const result = await db.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (result.error) throw result.error;
  }
  onProgress(100);
  return {
    url: kind === "private" ? path : db.storage.from(bucket).getPublicUrl(path).data.publicUrl,
    file: { name: file.name, path, type: file.type },
  };
}

/** Single-file field used by the private client updates. */
export function UploadField({
  label,
  value,
  onChange,
  privateFile = false,
  video = false,
  disabled = false,
}: {
  label: string;
  value?: string;
  onChange: (url: string, file?: { name: string; path: string; type: string }) => void;
  privateFile?: boolean;
  video?: boolean;
  disabled?: boolean;
}) {
  const [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState("");
  const kind: UploadKind = privateFile ? "private" : video ? "video" : "image";
  async function upload(file: File) {
    setError("");
    try {
      const result = await uploadFile(file, kind, setProgress);
      onChange(result.url, result.file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setProgress(null);
    }
  }
  return (
    <div className="upload-field">
      <span>{label}</span>
      <div className="upload-row">
        {value && <span className="upload-value">{value.split("/").pop()}</span>}
        <label className="upload-button">
          {progress !== null
            ? "Subiendo " + progress + "%"
            : value
              ? "Cambiar archivo"
              : "↑ Elegir archivo"}
          <input
            type="file"
            disabled={disabled || progress !== null}
            accept={accept(kind)}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
        {value && (
          <button type="button" className="admin-text-button" onClick={() => onChange("")}>
            Quitar
          </button>
        )}
      </div>
      {error && (
        <small role="alert" className="form-error">
          {error}
        </small>
      )}
    </div>
  );
}
