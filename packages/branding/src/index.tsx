import type { CSSProperties } from "react";
export function MadeByHass({
  href,
  variant = "minimal",
  newTab = false,
  utm,
  ariaLabel = "Designed and developed by HASS Studio",
  style,
}: {
  href: string;
  variant?: "minimal" | "light" | "dark" | "compact";
  newTab?: boolean;
  utm?: string;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const url = new URL(href);
  if (utm) {
    url.searchParams.set("utm_source", utm);
    url.searchParams.set("utm_medium", "signature");
  }
  return (
    <a
      href={url.toString()}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      style={{
        color:
          variant === "light"
            ? "#f4f1e9"
            : variant === "dark"
              ? "#282b20"
              : "inherit",
        fontSize: variant === "compact" ? 11 : 12,
        textDecoration: "none",
        ...style,
      }}
    >
      {variant !== "compact" && "Made with care by "}
      <span style={{ borderBottom: "1px solid currentColor" }}>
        HASS Studio
      </span>{" "}
      ↗
    </a>
  );
}
