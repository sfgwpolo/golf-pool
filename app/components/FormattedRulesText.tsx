import type { ReactNode } from "react";

function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = linkMatch?.[2]?.trim() ?? "";
      parts.push(
        isSafeUrl(href) ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            {linkMatch?.[1]}
          </a>
        ) : (
          token
        )
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function FormattedRulesText({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];
    nodes.push(
      <ul key={`list-${nodes.length}`} className="list-disc pl-5 space-y-1">
        {items.map((item, index) => (
          <li key={`${index}-${item}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushList();
      const src = imageMatch[2].trim();
      if (isSafeUrl(src)) {
        nodes.push(
          <img
            key={`image-${index}`}
            src={src}
            alt={imageMatch[1] || "Rules image"}
            className="mt-2 max-h-80 w-auto max-w-full rounded border border-gray-300 dark:border-gray-600"
          />
        );
      }
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      nodes.push(
        <h4 key={`h3-${index}`} className="font-semibold">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h3 key={`h2-${index}`} className="text-lg font-bold">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();
    nodes.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-2">{nodes}</div>;
}
