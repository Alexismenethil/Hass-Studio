"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Upload } from "tus-js-client";

export type UploadKind = "image" | "video" | "media" | "private";
const types: Record<UploadKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  video: ["video/mp4", "video/webm"],
  media: ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"],
  private: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ],
};
export const accept = (kind: UploadKind) => types[kind].join(",");
const ext: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

/** Uploads straight to Supabase Storage. Returns the public URL (or the private path). */
export async function uploadFile(
  file: File,
  kind: UploadKind,
  onProgress: (percent: number) => void = () => {},
) {
  if (file.size > 50 * 1024 * 1024) throw new Error(file.name + ": debe pesar menos de 50 MB.");
  if (!types[kind].includes(file.type))
    throw new Error(
      file.name +
        ": formato no permitido. Usa " +
        (kind === "video" ? "MP4 o WebM." : kind === "image" ? "JPG, PNG, WebP o AVIF." : "JPG, PNG, WebP, AVIF, MP4 o WebM."),
    );
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
  if (file.size > 6 * 1024 * 1024) {
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
        chunkSize: 6 * 1024 * 1024,
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
