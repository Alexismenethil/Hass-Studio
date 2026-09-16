import { test } from "node:test";
import assert from "node:assert/strict";
import {
  workSchema,
  settingsSchema,
  safeUrl,
  mediaUrl,
  isVideo,
  slugify,
  workCover,
  workMedia,
} from "./content";
import { updateSchema, canRetryPending, assertSameOrigin } from "./admin";
import initial from "./initial-data.json";
test("public schema excludes internal client and delivery data", () => {
  const w = workSchema.parse({
    ...initial.works[0],
    clientEmail: "private@example.com",
    progress: 65,
    email_payload: { to: "private@example.com" },
  });
  assert.equal("clientEmail" in w, false);
  assert.equal("progress" in w, false);
  assert.equal("email_payload" in w, false);
});
test("reject unsafe external and media URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.test",
    "https://user:pass@evil.test",
  ])
    assert.equal(safeUrl.safeParse(url).success, false);
  assert.equal(safeUrl.safeParse("https://example.com/project").success, true);
  assert.equal(
    mediaUrl.safeParse("https://untrusted.test/photo.jpg").success,
    false,
  );
  assert.equal(mediaUrl.safeParse("/images/olive.webp").success, true);
});
test("bilingual settings and concepts validate", () => {
  assert.doesNotThrow(() => settingsSchema.parse(initial.settings));
  initial.works.forEach((w) => assert.equal(workSchema.parse(w).concept, true));
});
test("updates cannot contain invalid progress or private traversal paths", () => {
  const u = {
    id: crypto.randomUUID(),
    project_id: crypto.randomUUID(),
    title: "Progress",
    message: "Done",
    progress: 65,
    preview_url: "",
    language: "en",
    attachments: [],
  };
  assert.equal(updateSchema.safeParse(u).success, true);
  assert.equal(updateSchema.safeParse({ ...u, progress: 101 }).success, false);
  assert.equal(
    updateSchema.safeParse({
      ...u,
      attachments: [{ name: "x", path: "../../private", type: "image/png" }],
    }).success,
    false,
  );
});
test("uncertain email retry has a two minute lock and 23 hour safety window", () => {
  const now = Date.now();
  assert.equal(
    canRetryPending(
      new Date(now - 3600000).toISOString(),
      new Date(now - 180000).toISOString(),
      now,
    ),
    true,
  );
  assert.equal(
    canRetryPending(
      new Date(now - 3600000).toISOString(),
      new Date(now - 60000).toISOString(),
      now,
    ),
    false,
  );
  assert.equal(
    canRetryPending(
      new Date(now - 86400000).toISOString(),
      new Date(now - 180000).toISOString(),
      now,
    ),
    false,
  );
});
test("cross origin administrative writes are rejected", () => {
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request("http://0.0.0.0:3001/api/admin/save", {
        headers: { host: "localhost:3001", origin: "http://localhost:3001" },
      }),
    ),
  );
  assert.throws(() =>
    assertSameOrigin(
      new Request("https://studio.test/api/admin/save", {
        headers: { origin: "https://evil.test" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request("https://studio.test/api/admin/save", {
        headers: { origin: "https://studio.test" },
      }),
    ),
  );
});
test("laptop screens keep order, accept videos and fall back to the cover", () => {
  const base = { cover: "", video: "", gallery: [] as string[] };
  const shot = "https://abc.supabase.co/storage/v1/object/public/public-media/u/a.webp";
  const clip = "https://abc.supabase.co/storage/v1/object/public/public-media/u/b.mp4";
  assert.equal(isVideo(clip), true);
  assert.equal(isVideo(clip + "?t=1"), true);
  assert.equal(isVideo(shot), false);
  assert.deepEqual(workMedia({ ...base, video: clip, gallery: [shot, clip] }), [clip, shot]);
  assert.deepEqual(workMedia({ ...base, cover: shot }), [shot]);
  assert.equal(workCover({ ...base, gallery: [clip, shot] }), shot);
  assert.equal(workCover({ ...base, gallery: [clip] }), clip);
  assert.equal(slugify("  Café Olivo — Web 2026! "), "cafe-olivo-web-2026");
});
