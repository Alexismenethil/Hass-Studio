import "server-only";
import { isCloudinary, isVideo } from "../content";

export type Shape = "tall" | "wide";

/** The pictures that ship with the site, so they never need asking about. */
const local: Record<string, Shape> = {
  "/images/olive.webp": "tall",
  "/images/coast-mobile.webp": "tall",
};

const known = new Map<string, Promise<Shape>>();

/**
 * Whether a picture is a phone screen (tall) or a page / photograph (wide), so a
 * phone can be drawn as a phone and a website as a website. Cloudinary answers
 * with the size of the original; the answer is cached with the page's data, so
 * each picture is asked about once.
 */
export function shapeOf(url: string): Promise<Shape> {
  if (!url || isVideo(url)) return Promise.resolve("wide");
  if (url.startsWith("/")) return Promise.resolve(local[url] ?? "wide");
  if (!isCloudinary(url)) return Promise.resolve("wide");
  let answer = known.get(url);
  if (!answer) {
    const info = url.replace("/image/upload/", "/image/upload/fl_getinfo/");
    answer = fetch(info, { cache: "force-cache", signal: AbortSignal.timeout(2500) })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { input?: { width?: number; height?: number } } | null) => {
        const w = json?.input?.width ?? 0;
        const h = json?.input?.height ?? 0;
        return w && h > w * 1.2 ? ("tall" as const) : ("wide" as const);
      })
      .catch(() => "wide" as const);
    known.set(url, answer);
  }
  return answer;
}

export async function shapesOf(urls: string[]) {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const shapes = await Promise.all(unique.map(shapeOf));
  return new Map(unique.map((url, i) => [url, shapes[i]]));
}
