"use client";
import Link from "next/link";
import type { Category, Settings, Work } from "@/lib/content";
import { workCover } from "@/lib/content";
import { Thumb, useAdmin } from "./kit";

export function WebOverview({
  settings,
  categories,
  works,
}: {
  settings: Settings;
  categories: Category[];
  works: Work[];
}) {
  const { base } = useAdmin();
  const live = works.filter((w) => w.published);
  const covers = works.map(workCover).filter(Boolean).slice(0, 4);
  const concepts = live.filter((w) => w.concept).length;
  const cards = [
    {
      href: "/web/servicios",
      title: "Servicios y trabajos",
      text: "El carrusel de la portada y tus proyectos reales, con sus fotos y vídeos.",
      media: (
        <span className="mosaic">
          {covers.map((src, i) => (
            <Thumb key={src + i} src={src} />
          ))}
        </span>
      ),
      stat: categories.length + " servicios · " + live.length + " trabajos publicados",
      action: "Gestionar trabajos",
      primary: true,
    },
    {
      href: "/web/inicio",
      title: "Página de inicio",
      text: "La portada con tu imagen y tu frase, y el texto que va después del carrusel.",
      media: <Thumb src={settings.heroImage} />,
      action: "Editar portada",
    },
    {
      href: "/web/estudio",
      title: "Estudio y contacto",
      text: "Tu biografía, tu foto, email, WhatsApp y redes sociales.",
      media: <Thumb src={settings.portrait || settings.studioImage} />,
      action: "Editar",
    },
    {
      href: "/web/marca",
      title: "Marca y SEO",
      text: "Nombre, logo y cómo aparece tu web en Google.",
      media: settings.logo ? <Thumb src={settings.logo} /> : <span className="brand-mark">HASS</span>,
      action: "Editar",
    },
  ];
  return (
    <section className="web-overview">
      <div className="section-title">
        <div>
          <span className="admin-overline">TU WEB PÚBLICA</span>
          <h2>Todo lo que ves en tu web se edita aquí.</h2>
        </div>
        <a className="admin-secondary" href="/es" target="_blank" rel="noreferrer">
          Ver la web ↗
        </a>
      </div>
      {concepts > 0 && (
        <div className="overview-tip">
          <span>✦</span>
          <p>
            Tienes <b>{concepts}</b> {concepts === 1 ? "trabajo de ejemplo" : "trabajos de ejemplo"} (estudios de
            diseño). Reemplázalos por tus proyectos reales en <b>Servicios y trabajos</b>, o elimínalos.
          </p>
          <Link href={base + "/web/servicios"} className="admin-primary">
            Ir ahora →
          </Link>
        </div>
      )}
      <div className="overview-cards">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={base + card.href}
            className={"overview-card" + (card.primary ? " is-primary" : "")}
          >
            <span className="overview-card-media">{card.media}</span>
            <span className="overview-card-body">
              <strong>{card.title}</strong>
              <small>{card.text}</small>
              {card.stat && <em>{card.stat}</em>}
              <b>{card.action} →</b>
            </span>
          </Link>
        ))}
      </div>
      <div className="section-title is-private">
        <div>
          <span className="admin-overline">CLIENTES · PRIVADO</span>
          <h2>Seguimiento de encargos. Nada de esto aparece en tu web.</h2>
        </div>
      </div>
    </section>
  );
}
