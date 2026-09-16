import { headers } from "next/headers";
import { siteUrl } from "@/lib/server/site-url";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";
const sans = localFont({
  src: "../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
});
const serif = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});
export const metadata: Metadata = {
  title: "HASS Studio",
  description: "Design and development by Alexis Huamani Rivera.",
  metadataBase: new URL(siteUrl),
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = (await headers()).get("x-hass-locale") === "es" ? "es" : "en";
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={sans.variable + " " + serif.variable}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
