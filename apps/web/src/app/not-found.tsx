import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">HASS STUDIO / 404</span>
      <h1>A quiet detour.</h1>
      <p>
        This page is no longer here. A new perspective is just a click away.
      </p>
      <Link href="/en">Back to the studio ↗</Link>
    </main>
  );
}
