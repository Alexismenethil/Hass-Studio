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
