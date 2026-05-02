import type { ReactNode } from 'react';
import { ScrollText } from 'lucide-react';
import whitepaperMarkdown from '../../whitepaper.md?raw';

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

const parseMarkdownBlocks = (markdown: string): Block[] => {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const pushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' ').trim(),
    });
    paragraphLines = [];
  };

  const pushList = () => {
    if (!listType || !listItems.length) return;
    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      pushParagraph();
      pushList();
      continue;
    }

    if (line.startsWith('# ')) {
      pushParagraph();
      pushList();
      blocks.push({ type: 'h1', text: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith('## ')) {
      pushParagraph();
      pushList();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }

    const unordered = line.match(/^-\s+(.+)$/);
    if (unordered) {
      pushParagraph();
      const nextItem = unordered[1].trim();
      if (listType !== 'ul') {
        pushList();
        listType = 'ul';
      }
      listItems.push(nextItem);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      pushParagraph();
      const nextItem = ordered[1].trim();
      if (listType !== 'ol') {
        pushList();
        listType = 'ol';
      }
      listItems.push(nextItem);
      continue;
    }

    pushList();
    paragraphLines.push(line);
  }

  pushParagraph();
  pushList();

  return blocks;
};

const renderInlineMarkdown = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match = tokenRegex.exec(text);

  while (match) {
    const [token] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`${start}-strong`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`${start}-code`}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = start + token.length;
    match = tokenRegex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

const blocks = parseMarkdownBlocks(whitepaperMarkdown);

const Whitepaper = ({ onBack: _onBack }: { onBack: () => void }) => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <div className="section-eyebrow flex items-center gap-1.5">
          <ScrollText className="h-3 w-3" /> TIP Protocol Reference
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">TIP Whitepaper</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Canonical technical overview of TIP design goals, threat model, and operational assumptions.
        </p>
      </header>

      <article className="panel space-y-5 px-6 py-6 text-sm leading-relaxed md:px-8 md:py-7">
        {blocks.map((block, blockIndex) => {
          if (block.type === 'h1') {
            return (
              <h2 key={`h1-${blockIndex}`} className="text-lg font-semibold tracking-tight">
                {block.text}
              </h2>
            );
          }

          if (block.type === 'h2') {
            return (
              <h3 key={`h2-${blockIndex}`} className="text-base font-semibold tracking-tight pt-1">
                {block.text}
              </h3>
            );
          }

          if (block.type === 'paragraph') {
            return (
              <p key={`p-${blockIndex}`} className="text-foreground/80">
                {renderInlineMarkdown(block.text)}
              </p>
            );
          }

          if (block.type === 'ul') {
            return (
              <ul
                key={`ul-${blockIndex}`}
                className="space-y-1.5 list-disc pl-5 text-foreground/80"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`ul-item-${blockIndex}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
          }

          return (
            <ol
              key={`ol-${blockIndex}`}
              className="space-y-1.5 list-decimal pl-5 text-foreground/80"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`ol-item-${blockIndex}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        })}
      </article>

      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        This whitepaper is bundled with the private application release.
      </footer>
    </div>
  );
};

export default Whitepaper;
