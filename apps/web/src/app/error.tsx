"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <span className="eyebrow">HASS STUDIO</span>
      <h1>A brief pause.</h1>
      <p>We couldn't load this page. Please try again in a moment.</p>
      <button onClick={reset}>Try again ↗</button>
    </main>
  );
}
