import type { ReactNode } from "react";

export interface SafeMarkdownOptions {
  stripLeadingHeadingLine?: boolean;
}

export interface SafeMarkdownParagraphBlock {
  kind: "paragraph";
  text: string;
}

export interface SafeMarkdownListBlock {
  kind: "list";
  items: string[];
}

export type SafeMarkdownBlock = SafeMarkdownParagraphBlock | SafeMarkdownListBlock;

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/gu, "\n").trim();
}

function isStandaloneHeadingLine(line: string) {
  return /^\*\*[^*]+\*\*(?:\s+\(.*\))?$/u.test(line.trim());
}

function removeLeadingHeadingLine(markdown: string) {
  const lines = normalizeMarkdown(markdown).split("\n");
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstNonEmptyIndex >= 0 && isStandaloneHeadingLine(lines[firstNonEmptyIndex])) {
    lines.splice(firstNonEmptyIndex, 1);
  }

  return lines.join("\n").trim();
}

function toMarkdownBody(markdown: string, options?: SafeMarkdownOptions) {
  if (options?.stripLeadingHeadingLine) {
    return removeLeadingHeadingLine(markdown);
  }

  return normalizeMarkdown(markdown);
}

function toSafeExternalHref(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return rawUrl;
    }
  } catch {
    return null;
  }

  return null;
}

function inlineMarkdownToPlainText(text: string) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, "$1")
    .replace(/\*\*([^*]+)\*\*/gu, "$1")
    .replace(/`([^`]+)`/gu, "$1");
}

export function parseSafeMarkdownBlocks(markdown: string, options?: SafeMarkdownOptions): SafeMarkdownBlock[] {
  const body = toMarkdownBody(markdown, options);
  if (body.length === 0) {
    return [];
  }

  const lines = body.split("\n");
  const blocks: SafeMarkdownBlock[] = [];

  let activeParagraphLines: string[] = [];
  let activeListItems: string[] = [];

  const flushParagraph = () => {
    if (activeParagraphLines.length === 0) {
      return;
    }

    blocks.push({
      kind: "paragraph",
      text: activeParagraphLines.join(" ").trim()
    });
    activeParagraphLines = [];
  };

  const flushList = () => {
    if (activeListItems.length === 0) {
      return;
    }

    blocks.push({
      kind: "list",
      items: activeListItems.map((item) => item.trim())
    });
    activeListItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const listMatch = trimmed.match(/^- (.+)$/u);
    if (listMatch) {
      flushParagraph();
      activeListItems.push(listMatch[1]);
      continue;
    }

    flushList();
    activeParagraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function renderInlineSafeMarkdown(text: string, keyPrefix: string): ReactNode {
  const tokenPattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/gu;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;
  let match = tokenPattern.exec(text);

  while (match) {
    const [fullMatch, linkText, linkUrl, boldText, codeText] = match;
    const matchStart = match.index;

    if (matchStart > cursor) {
      nodes.push(text.slice(cursor, matchStart));
    }

    if (typeof linkText === "string" && typeof linkUrl === "string") {
      const safeHref = toSafeExternalHref(linkUrl);
      if (safeHref) {
        nodes.push(
          <a
            href={safeHref}
            key={`${keyPrefix}-link-${tokenIndex}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {linkText}
          </a>
        );
      } else {
        nodes.push(linkText);
      }
    } else if (typeof boldText === "string") {
      nodes.push(<strong key={`${keyPrefix}-strong-${tokenIndex}`}>{boldText}</strong>);
    } else if (typeof codeText === "string") {
      nodes.push(<code key={`${keyPrefix}-code-${tokenIndex}`}>{codeText}</code>);
    }

    cursor = matchStart + fullMatch.length;
    tokenIndex += 1;
    match = tokenPattern.exec(text);
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  if (nodes.length <= 1) {
    return nodes[0] ?? "";
  }

  return nodes;
}

export function markdownToPlainText(markdown: string, options?: SafeMarkdownOptions) {
  const blocks = parseSafeMarkdownBlocks(markdown, options);
  const textSegments = blocks.flatMap((block) => {
    if (block.kind === "paragraph") {
      return inlineMarkdownToPlainText(block.text);
    }

    return block.items.map((item) => inlineMarkdownToPlainText(item));
  });

  return textSegments.join(" ").replace(/\s+/gu, " ").trim();
}

