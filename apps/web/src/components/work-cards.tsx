import Link from "next/link";
import { Media } from "./media";
import { Arrow } from "./icon";
import { copy, text, workCover, type Locale, type Work } from "@/lib/content";

export function WorkCards({ works, locale }: { works: Work[]; locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="work-cards">
      {works.map((w) => (
        <article key={w.id} className="work-card" data-reveal>
          <Link
            href={"/" + locale + "/work/" + w.slug}
            className="work-card-link"
            data-cursor={t.view}
          >
            <div className="work-card-media">
              <div className="work-card-drift" data-parallax="5">
                <Media
                  src={workCover(w)}
                  alt={w.title}
                  sizes="(max-width: 767px) 100vw, 46vw"
                />
              </div>
              {w.concept && <span className="work-card-tag">{t.concept}</span>}
            </div>
            <div className="work-card-meta">
              <h3>{w.title}</h3>
              <span>{w.year}</span>
            </div>
            <p>
              {w.services.filter(Boolean).slice(0, 3).join(" · ") ||
                text(w.description, locale).split(". ")[0]}
              <Arrow diagonal />
            </p>
          </Link>
        </article>
      ))}
    </div>
  );
}
