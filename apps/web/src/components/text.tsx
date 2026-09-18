import { Fragment, type CSSProperties } from "react";
import { lines } from "@/lib/content";

/**
 * Words come into focus one after another as the reader scrolls: each one knows
 * its turn (--wi) and how many there are (--wc), which is all the CSS needs to
 * give it its own slice of the scroll.
 */
export function Words({ text }: { text: string }) {
  const rows = lines(text);
  const count = rows.join(" ").split(" ").filter(Boolean).length || 1;
  let index = 0;
  return (
    <>
      {rows.map((line, i) => (
        <span key={i} className="line">
          {line.split(" ").map((word, n) => (
            <Fragment key={n}>
              {/* The space stays outside: an inline-block would swallow it. */}
              <span className="w" style={{ "--wi": index++, "--wc": count } as CSSProperties}>
                {word}
              </span>{" "}
            </Fragment>
          ))}
        </span>
      ))}
    </>
  );
}

/**
 * Letters for focus-pull reveals. Words stay unbroken; every letter knows its
 * position (--ci) and its share of the line (--cr) for staggering in CSS.
 */
export function Chars({
  text,
  italicLast = false,
  single = false,
}: {
  text: string;
  italicLast?: boolean;
  single?: boolean;
}) {
  const list = single ? [text.replace(/\n/g, " ")] : lines(text);
  let index = 0;
  const total = list.join(" ").length || 1;
  return (
    <>
      {list.map((line, i) => (
        <span
          key={i}
          className={"cline" + (italicLast && list.length > 1 && i === list.length - 1 ? " italic" : "")}
        >
          {line.split(" ").map((word, w) => (
            <Fragment key={w}>
              {w > 0 && " "}
              <span className="cword">
                {Array.from(word).map((char, c) => {
                  const n = index++;
                  return (
                    <span
                      key={c}
                      className="char"
                      style={{ "--ci": n, "--cr": (n / total).toFixed(3) } as CSSProperties}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </>
  );
}
