import type { FunctionComponent, ReactNode } from 'react';
import { Box, Flex, Text, Button } from '../primitives';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../Theme';

/**
 * A small markdown renderer for AI answers.
 *
 * It supports what the tutor prompt guarantees: paragraphs, lists, headings,
 * bold/italic/inline-code, links, tables, and fenced code blocks. It is not a
 * general markdown parser — unknown syntax is shown as plain text, and
 * nothing is executed: the content is rendered as React elements, never as
 * HTML, so an answer can not inject markup into the webview.
 */

interface Block {
  kind: 'heading' | 'paragraph' | 'list' | 'code' | 'table' | 'quote';
  level?: number;
  lines: string[];
  language?: string;
  ordered?: boolean;
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // Fenced code block.
    if (line.trimStart().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trimStart().startsWith('```')) {
        body.push(lines[index]);
        index += 1;
      }
      index += 1; // closing fence
      blocks.push({ kind: 'code', language, lines: body });
      continue;
    }

    // Heading.
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length, lines: [heading[2]] });
      index += 1;
      continue;
    }

    // Table.
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const body: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        body.push(lines[index].trim());
        index += 1;
      }
      blocks.push({ kind: 'table', lines: body });
      continue;
    }

    // Blockquote.
    if (line.trimStart().startsWith('>')) {
      const body: string[] = [];
      while (index < lines.length && lines[index].trimStart().startsWith('>')) {
        body.push(lines[index].trimStart().slice(1).trim());
        index += 1;
      }
      blocks.push({ kind: 'quote', lines: body });
      continue;
    }

    // List.
    const listItem = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(line);
    if (listItem) {
      const ordered = /\d+\./.test(listItem[2]);
      const body: string[] = [];
      while (index < lines.length) {
        const match = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(lines[index]);
        if (!match) {
          break;
        }
        if (/\d+\./.test(match[2]) !== ordered) {
          break;
        }
        body.push(match[3]);
        index += 1;
      }
      blocks.push({ kind: 'list', lines: body, ordered });
      continue;
    }

    // Paragraph — collect until an empty line.
    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const body: string[] = [];
    while (index < lines.length && lines[index].trim() !== '') {
      body.push(lines[index]);
      index += 1;
    }
    blocks.push({ kind: 'paragraph', lines: body });
  }

  return blocks;
}

/** Renders inline markdown — bold, italics, inline code and links. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // The pattern handles **bold**, *italic*, `code` and [text](url) in one pass.
  const pattern =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b${key}`} style={{ color: COLORS.textPrimary }}>
          {match[2]}
        </strong>
      );
    } else if (match[4] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i${key}`}>{match[4]}</em>);
    } else if (match[6] !== undefined) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${key}`}
          style={{
            fontFamily: '"Cascadia Code", Consolas, monospace',
            fontSize: '0.85em',
            backgroundColor: COLORS.surfaceElevated,
            color: '#93c5fd',
            borderRadius: RADIUS.sm,
            padding: '0.1em 0.35em',
          }}
        >
          {match[6]}
        </code>
      );
    } else if (match[8] !== undefined) {
      nodes.push(
        <a
          key={`${keyPrefix}-a${key}`}
          href={match[9]}
          style={{ color: COLORS.accent, textDecoration: 'none' }}
        >
          {match[8]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
    key += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/** Renders one fenced code block with a copy button. */
const CodeBlock: FunctionComponent<{ code: string; language: string }> = ({ code, language }) => {
  const handleCopy = () => {
    void navigator.clipboard?.writeText(code);
  };

  return (
    <Box
      style={{
        position: 'relative',
        backgroundColor: '#0b1120',
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        padding: SPACING.sm,
        margin: `${SPACING.sm} 0`,
        overflowX: 'auto',
      } as React.CSSProperties}
    >
      <Flex
        justify="between"
        align="center"
        style={{ marginBottom: SPACING.xs }}
      >
        <Text
          as="span"
          style={{ ...TYPOGRAPHY.small, color: COLORS.textMuted, fontSize: '0.75rem' } as React.CSSProperties}
        >
          {language || 'text'}
        </Text>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          Copy
        </Button>
      </Flex>
      <Box
        style={{
          fontFamily: '"Cascadia Code", Consolas, monospace',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          color: '#e2e8f0',
          whiteSpace: 'pre',
          margin: 0,
        } as React.CSSProperties}
      >
        {code}
      </Box>
    </Box>
  );
};

/** Renders a markdown table. */
function renderTable(lines: string[], key: string): ReactNode {
  const rows = lines
    .filter((line) => !/^\|[\s:-]+\|$/.test(line.replace(/[|\s]/g, (c) => (c === '|' ? '|' : ''))) )
    .map((line) =>
      line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim())
    )
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)));

  if (rows.length === 0) {
    return null;
  }

  const [header, ...body] = rows;

  return (
    <Box
      key={key}
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        margin: `${SPACING.sm} 0`,
      } as React.CSSProperties}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.surfaceElevated }}>
            {header.map((cell, i) => (
              <th
                key={`${key}-h${i}`}
                style={{
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  color: COLORS.textPrimary,
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                {renderInline(cell, `${key}-h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((cells, r) => (
            <tr key={`${key}-r${r}`}>
              {cells.map((cell, c) => (
                <td
                  key={`${key}-r${r}c${c}`}
                  style={{
                    padding: '0.5rem 0.75rem',
                    color: COLORS.textSecondary,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {renderInline(cell, `${key}-r${r}c${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

export const AIMarkdown: FunctionComponent<{ content: string }> = ({ content }) => {
  const blocks = parseMarkdown(content);

  return (
    <Box>
      {blocks.map((block, i) => {
        const key = `md-${i}`;

        switch (block.kind) {
        case 'heading': {
          const Tag = (block.level === 1
            ? 'h3'
            : block.level === 2
              ? 'h4'
              : 'h4') as React.ElementType;
          const sizes = {
            1: { ...TYPOGRAPHY.h4, fontSize: '1.125rem' },
            2: { ...TYPOGRAPHY.h4, fontSize: '1rem' },
          } as Record<number, React.CSSProperties>;
          return (
            <Tag
              key={key}
              style={{
                ...(sizes[block.level ?? 3] ?? TYPOGRAPHY.small),
                color: COLORS.textPrimary,
                margin: `${SPACING.md} 0 ${SPACING.xs} 0`,
                fontWeight: 600,
              } as React.CSSProperties}
            >
              {renderInline(block.lines[0], key)}
            </Tag>
          );
        }
        case 'code':
          return (
            <CodeBlock
              key={key}
              code={block.lines.join('\n')}
              language={block.language ?? ''}
            />
          );
        case 'table':
          return renderTable(block.lines, key);
        case 'quote':
          return (
            <Box
              key={key}
              style={{
                borderLeft: `3px solid ${COLORS.accent}`,
                paddingLeft: SPACING.md,
                margin: `${SPACING.sm} 0`,
                color: COLORS.textSecondary,
              } as React.CSSProperties}
            >
              {block.lines.map((line, j) => (
                <Text as="p" key={`${key}-q${j}`} style={{ margin: `0 0 ${SPACING.xs} 0`, lineHeight: 1.6 }}>
                  {renderInline(line, `${key}-q${j}`)}
                </Text>
              ))}
            </Box>
          );
        case 'list':
          return (
            <Box key={key} style={{ margin: `${SPACING.xs} 0`, paddingLeft: SPACING.lg }}>
              {block.lines.map((line, j) => (
                <Flex key={`${key}-l${j}`} align="start" gap="0.5rem" style={{ marginBottom: '0.25rem' }}>
                  <Text as="span" style={{ color: COLORS.accent, flexShrink: 0 }}>
                    {block.ordered ? `${j + 1}.` : '•'}
                  </Text>
                  <Text as="span" style={{ color: COLORS.textSecondary, lineHeight: 1.6 }}>
                    {renderInline(line, `${key}-l${j}`)}
                  </Text>
                </Flex>
              ))}
            </Box>
          );
        default:
          return (
            <Box key={key} style={{ margin: `${SPACING.xs} 0` }}>
              {block.lines.map((line, j) => (
                <Text as="p" key={`${key}-p${j}`} style={{ margin: 0, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                  {renderInline(line, `${key}-p${j}`)}
                </Text>
              ))}
            </Box>
          );
        }
      })}
    </Box>
  );
};
