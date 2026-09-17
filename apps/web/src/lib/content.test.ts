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
  cloudinaryEager,
  contactSchema,
  stillOf,
  videoPoster,
  videoSource,
  whatsappLink,
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
  // Settings saved before the contact background existed still load.
  const { contactImage: _, ...older } = initial.settings;
  assert.equal(settingsSchema.parse(older).contactImage, "");
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
test("cloudinary uploads are accepted, signed and delivered as light renditions", async () => {
  const { signCloudinary, uploadParams } = await import("./cloudinary");
  // Reference example from Cloudinary's signature documentation.
  assert.equal(
    signCloudinary(
      { eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 },
      "abcd",
    ),
    "bfd09f95f331f558cbd1320e67aa8d488770583e",
  );
  assert.deepEqual(Object.keys(uploadParams("image")).sort(), ["asset_folder", "timestamp"]);
  assert.equal(uploadParams("video").eager, cloudinaryEager);
  const video = "https://res.cloudinary.com/demo/video/upload/v17/hass-studio/reel.mov";
  const image = "https://res.cloudinary.com/demo/image/upload/v17/hass-studio/home.png";
  assert.equal(mediaUrl.safeParse(video).success, true);
  assert.equal(mediaUrl.safeParse(image).success, true);
  for (const bad of [
    "https://res.cloudinary.com/demo/raw/upload/v1/x.html",
    "https://res.cloudinary.com.evil.test/demo/image/upload/x.png",
  ])
    assert.equal(mediaUrl.safeParse(bad).success, false, bad);
  assert.equal(isVideo(video), true);
  assert.equal(isVideo(image), false);
  assert.equal(
    videoSource(video),
    "https://res.cloudinary.com/demo/video/upload/c_limit,q_auto,w_1920/v17/hass-studio/reel.mp4",
  );
  assert.equal(
    videoPoster(video),
    "https://res.cloudinary.com/demo/video/upload/c_limit,q_auto,so_0,w_1600/v17/hass-studio/reel.jpg",
  );
  assert.equal(isVideo(videoPoster(video)), false);
  assert.equal(stillOf(image), image);
  assert.equal(videoSource("/images/clip.mp4"), "/images/clip.mp4");
});
test("contact messages are validated before anything is sent", () => {
  const message = {
    name: "Ana",
    email: "ana@example.com",
    phone: "+51 917 785 052",
    service: "Experiencias web",
    message: "Quiero una web para mi hotel.",
    locale: "es",
    website: "",
    startedAt: Date.now(),
  };
  assert.equal(contactSchema.safeParse(message).success, true);
  assert.equal(contactSchema.safeParse({ ...message, email: "nope" }).success, false);
  assert.equal(contactSchema.safeParse({ ...message, message: "hola" }).success, false);
  assert.equal(contactSchema.safeParse({ ...message, phone: "<script>" }).success, false);
  assert.equal(whatsappLink("+51 917785052", "Hola"), "https://wa.me/51917785052?text=Hola");
});
