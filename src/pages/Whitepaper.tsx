import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
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
        <code key={`${start}-code`} className="px-1.5 py-0.5 rounded bg-muted font-mono text-[0.9em] text-foreground">
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

const Whitepaper = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to App
      </button>

      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/50 font-semibold">TIP Protocol Reference</p>
        <h1 className="text-4xl font-extrabold tracking-tight">TIP Whitepaper</h1>
        <p className="text-foreground/60">
          Canonical technical overview of TIP design goals, threat model, and operational assumptions.
        </p>
      </header>

      <article className="glass p-6 md:p-10 space-y-6 leading-relaxed">
        {blocks.map((block) => {
          if (block.type === 'h1') {
            return (
              <h2 key={`h1-${block.text}`} className="text-2xl md:text-3xl font-bold tracking-tight">
                {block.text}
              </h2>
            );
          }

          if (block.type === 'h2') {
            return (
              <h3 key={`h2-${block.text}`} className="text-xl md:text-2xl font-bold tracking-tight pt-2">
                {block.text}
              </h3>
            );
          }

          if (block.type === 'paragraph') {
            return (
              <p key={`p-${block.text.slice(0, 50)}`} className="text-foreground/80">
                {renderInlineMarkdown(block.text)}
              </p>
            );
          }

          if (block.type === 'ul') {
            return (
              <ul key={`ul-${block.items[0]?.slice(0, 30) ?? 'empty'}`} className="space-y-2 pl-5 list-disc text-foreground/80">
                {block.items.map((item) => (
                  <li key={`ul-item-${item.slice(0, 50)}`}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
          }

          return (
            <ol key={`ol-${block.items[0]?.slice(0, 30) ?? 'empty'}`} className="space-y-2 pl-5 list-decimal text-foreground/80">
              {block.items.map((item) => (
                <li key={`ol-item-${item.slice(0, 50)}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        })}
      </article>

      <footer className="text-xs text-foreground/50 pt-2">
        <a
          href="https://github.com/mahedirakib/bitcoinwill/blob/main/whitepaper.md"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 decoration-black/10 hover:text-foreground/80 transition-colors"
        >
          View raw markdown on GitHub
        </a>
      </footer>
    </div>
  );
};

export default Whitepaper;
