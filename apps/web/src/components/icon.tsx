export function Arrow({
  diagonal = false,
  className = "",
}: {
  diagonal?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Asterisk() {
  return (
    <svg
      width="31"
      height="31"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      {[0, 30, 60, 90, 120, 150].map((r) => (
        <path
          key={r}
          d="M20 3v34"
          stroke="currentColor"
          strokeWidth=".8"
          transform={"rotate(" + r + " 20 20)"}
        />
      ))}
    </svg>
  );
}

const socialPaths: [RegExp, string][] = [
  [/instagram\./, "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.2-1.6h.01"],
  [/linkedin\./, "M4 9h3.5v11H4zM5.75 3.5a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM10 9h3.3v1.6c.6-1 1.9-1.9 3.7-1.9 3.4 0 4 2.2 4 5.1V20h-3.5v-5.4c0-1.4 0-3-1.9-3s-2.1 1.4-2.1 2.9V20H10z"],
  [/facebook\.|fb\.com/, "M14 8.5V6.8c0-.9.6-1.3 1.3-1.3H17V2.5h-2.6C11.6 2.5 10.5 4.3 10.5 7v1.5H8V12h2.5v9.5H14V12h2.6l.4-3.5z"],
  [/wa\.me|whatsapp\./, "M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 20.5 11.7ZM9 8.2c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.8c.7 1.3 1.8 2.3 3.1 3l.8-.7c.2-.1.4-.2.6-.1l1.9.9c.2.1.3.3.3.5v.5c0 .5-.4 1.3-1.6 1.5-1.3.2-3.4-.5-5.4-2.4-2-2-2.6-4-2.4-5.2.1-.5.3-.8.6-1.1Z"],
  [/mailto:/, "M3.5 6h17v12h-17zM3.5 6.5l8.5 7 8.5-7"],
  [/tiktok\./, "M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.3 2.6 2 4.4 5 4.6"],
  [/behance\.|dribbble\.|github\.|x\.com|twitter\./, "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.4 3.8 5.5 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3Z"],
];

/** A fine line icon for a social or contact link, recognised from its address. */
export function SocialIcon({ url, className = "" }: { url: string; className?: string }) {
  const path = socialPaths.find(([test]) => test.test(url))?.[1] ?? socialPaths[socialPaths.length - 1][1];
  return (
    <svg className={"social-icon " + className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
