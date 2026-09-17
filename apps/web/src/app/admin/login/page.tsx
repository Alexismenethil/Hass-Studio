import Link from "next/link";
import { configured } from "@/lib/server/supabase";
import { getContent } from "@/lib/server/content";
import { Media } from "@/components/media";
import { LoginForm } from "./login-form";
export default async function Login() {
  const ready = configured();
  // The panel greets you with the website's own photograph, whatever it is today.
  const image = await getContent()
    .then(({ settings }) => settings.detailImage || settings.heroImage)
    .catch(() => "");
  return (
    <main className="login-page">
      <div className="login-image">
        {image && <Media src={image} sizes="50vw" priority />}
        <span>
          HASS
          <br />
          <small>STUDIO</small>
        </span>
        <p>
          A little intention.
          <br />A world of difference.
        </p>
      </div>
      <div className="login-content">
        <Link href="/en" className="eyebrow">
          ← Volver al estudio
        </Link>
        <div>
          <span className="eyebrow">TU ESPACIO DE TRABAJO</span>
          <h1>
            Welcome
            <br />
            <em>back, Alexis.</em>
          </h1>
          <p>Los detalles importan. También aquí.</p>
          <LoginForm configured={ready} />
          {!ready && (
            <div className="setup-note">
              La conexión con Supabase está pendiente. El acceso se habilitará
              cuando se configuren las variables y tu cuenta administradora.
              {process.env.NODE_ENV !== "production" && (
                <Link href="/admin/preview">Ver diseño del panel ↗</Link>
              )}
            </div>
          )}
        </div>
        <small>HASS Studio · Acceso privado</small>
      </div>
    </main>
  );
}
