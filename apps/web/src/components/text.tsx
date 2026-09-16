import { Fragment, type CSSProperties } from "react";
import { lines } from "@/lib/content";

/** Each line is masked so it can rise into view. */
export function Lines({ text, italicLast = false }: { text: string; italicLast?: boolean }) {
  const list = lines(text);
  return (
    <>
      {list.map((line, i) => (
        <span
          key={i}
          className={
            "line" + (italicLast && list.length > 1 && i === list.length - 1 ? " italic" : "")
          }
        >
          <span className="line-inner">{line}</span>
        </span>
      ))}
    </>
  );
}

/** Words brighten one after another as the reader scrolls. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {lines(text).map((line, i) => (
        <span key={i} className="line">
          {line.split(" ").map((word, n) => (
            <span key={n} className="w">
              {word}{" "}
            </span>
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
