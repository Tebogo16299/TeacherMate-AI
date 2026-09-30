import type { ReactNode } from "react";

function inline(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = `${keyBase}-i${i++}`;
    if (match[1] !== undefined) parts.push(<strong key={key}>{match[1]}</strong>);
    else if (match[2] !== undefined) parts.push(<code key={key}>{match[2]}</code>);
    else parts.push(<em key={key}>{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const splitRow = (line: string) =>
  line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

/** Renders the markdown-ish teaching material returned by the AI. */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/```/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[][] | null = null;

  const flush = () => {
    if (list) {
      const items = list.items.map((item, index) => <li key={index}>{inline(item, `li${blocks.length}-${index}`)}</li>);
      blocks.push(
        list.ordered ? <ol key={`b${blocks.length}`}>{items}</ol> : <ul key={`b${blocks.length}`}>{items}</ul>,
      );
      list = null;
    }
    if (table) {
      const [head, ...body] = table;
      blocks.push(
        <table key={`b${blocks.length}`}>
          <thead>
            <tr>
              {(head ?? []).map((cell, index) => (
                <th key={index}>{inline(cell, `th${index}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, index) => (
                  <td key={index}>{inline(cell, `td${rowIndex}-${index}`)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      table = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flush();
      continue;
    }

    if (/^\|.*\|$/.test(trimmed)) {
      if (/^\|[\s|:-]+\|$/.test(trimmed)) continue;
      table = table ?? [];
      table.push(splitRow(trimmed));
      continue;
    }
    if (table) flush();

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      const level = (heading[1] ?? "#").length;
      const content = inline(heading[2] ?? "", `h${blocks.length}`);

      blocks.push(
        level === 1 ? (
          <h1 key={`b${blocks.length}`}>{content}</h1>
        ) : level === 2 ? (
          <h2 key={`b${blocks.length}`}>{content}</h2>
        ) : level === 3 ? (
          <h3 key={`b${blocks.length}`}>{content}</h3>
        ) : (
          <h4 key={`b${blocks.length}`}>{content}</h4>
        ),
      );
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flush();
      blocks.push(<hr key={`b${blocks.length}`} />);
      continue;
    }

    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (ordered || bullet) {
      const isOrdered = Boolean(ordered);
      if (list && list.ordered !== isOrdered) flush();
      list = list ?? { ordered: isOrdered, items: [] };
      list.items.push(((ordered ? ordered[1] : bullet?.[1]) ?? "").trim());
      continue;
    }

    if (list) {
      list.items[list.items.length - 1] += ` ${trimmed}`;
      continue;
    }

    blocks.push(<p key={`b${blocks.length}`}>{inline(trimmed, `p${blocks.length}`)}</p>);
  }
  flush();

  return <div className="material">{blocks}</div>;
}
