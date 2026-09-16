import { pageMetadata } from "@/lib/server/metadata";
import Link from "next/link";
import { getContent } from "@/lib/server/content";
import { text, copy, type Locale } from "@/lib/content";
import { Arrow } from "@/components/icon";
export default async function Links({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const { settings: s } = await getContent();
  return (
    <main id="main" className="links-page" data-header="light">
      <span className="eyebrow">{s.name}</span>
      <h1>
        HASS <em>Studio.</em>
      </h1>
      <p>{text(s.heroDescription, lang)}</p>
      {(["work", "studio", "contact"] as const).map((k) => (
        <Link key={k} href={"/" + lang + "/" + k}>
          {copy[lang][k]}
          <Arrow diagonal />
        </Link>
      ))}
      {s.socials.map((x) => (
        <a key={x.label} href={x.url} target="_blank" rel="noopener noreferrer">
          {x.label}
          <Arrow diagonal />
        </a>
      ))}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return pageMetadata(lang, "/links");
}
