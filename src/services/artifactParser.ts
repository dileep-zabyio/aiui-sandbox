/**
 * Parses LLM output into interleaved text and artifact content blocks.
 *
 * Artifact blocks use the fenced syntax:
 *   :::artifact{type="table" title="My Table"}
 *   { "columns": [...], "rows": [...] }
 *   :::
 */

export interface TextBlock {
  kind: 'text';
  content: string;
}

export interface ArtifactBlock {
  kind: 'artifact';
  artifactType: string;
  title: string;
  props: Record<string, unknown>;
}

export type ContentBlock = TextBlock | ArtifactBlock;

/**
 * Regex to match :::artifact{type="..." title="..."} ... ::: blocks.
 *
 * Captures:
 *   1: the attribute string inside { }
 *   2: the JSON body between the opening and closing :::
 */
const ARTIFACT_BLOCK_RE = /:::(artifact|[a-zA-Z0-9_-]+)(?:\{([^}]+)\})?([\s\S]*?):::/gu;

/**
 * Extract all key-value attributes from the attribute string.
 * Handles key="value", key='value', and key=value.
 */
function parseAttributes(attrs: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /([a-zA-Z0-9_-]+)=(?:["']([^"']*)["']|([^\s"']+))/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrs)) !== null) {
    const key = match[1];
    const val = match[2] ?? match[3] ?? '';
    result[key] = val;
  }
  return result;
}

/**
 * Parse an LLM response string into an ordered array of content blocks.
 */
export function parseArtifacts(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let lastIndex = 0;

  // Reset the regex lastIndex
  ARTIFACT_BLOCK_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = ARTIFACT_BLOCK_RE.exec(content)) !== null) {
    // Text before this artifact block
    let textBefore = content.slice(lastIndex, match.index).trim();
    // Strip trailing backticks that might have enclosed the artifact block in LLM markdown
    textBefore = textBefore.replace(/`+$/u, '').trim();
    if (textBefore) {
      blocks.push({ kind: 'text', content: textBefore });
    }

    const firstWord = match[1];
    const attrs = match[2] || '';
    const jsonBody = match[3].trim();

    const attrMap = parseAttributes(attrs);
    const artifactType = firstWord === 'artifact' ? (attrMap.type || '') : firstWord;
    const title = attrMap.title || '';

    // Parse JSON body props if present
    let bodyProps: Record<string, unknown> = {};
    if (jsonBody) {
      try {
        bodyProps = JSON.parse(jsonBody);
      } catch {
        // If JSON is invalid, fall back to content key
        bodyProps = { content: jsonBody };
      }
    }

    // Merge attributes into props (converting types if applicable)
    const props: Record<string, unknown> = { ...bodyProps };
    for (const [key, val] of Object.entries(attrMap)) {
      if (key === 'type' || key === 'title') continue;
      
      const trimmedVal = val.trim();
      if (trimmedVal === 'true') {
        props[key] = true;
      } else if (trimmedVal === 'false') {
        props[key] = false;
      } else if (!isNaN(Number(trimmedVal)) && trimmedVal !== '') {
        props[key] = Number(trimmedVal);
      } else {
        props[key] = val;
      }
    }

    blocks.push({
      kind: 'artifact',
      artifactType,
      title,
      props,
    });

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last artifact block
  let trailingText = content.slice(lastIndex).trim();
  // Strip leading backticks that might have closed the enclosure in LLM markdown
  trailingText = trailingText.replace(/^`+/u, '').trim();
  if (trailingText) {
    blocks.push({ kind: 'text', content: trailingText });
  }

  // If no blocks were produced at all, return the full content as a single text block
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ kind: 'text', content: content.trim() });
  }

  return postProcessIframeBlocks(blocks);
}

/**
 * Scan all text blocks for iframe tags and convert them to interactive iframe artifacts.
 */
function postProcessIframeBlocks(blocks: ContentBlock[]): ContentBlock[] {
  const result: ContentBlock[] = [];
  const IFRAME_RE = /<iframe\b([^>]*src="([^"]+)"[^>]*)>(?:[\s\S]*?<\/iframe>)?/i;

  for (const block of blocks) {
    if (block.kind !== 'text') {
      result.push(block);
      continue;
    }

    let text = block.content;
    let match = IFRAME_RE.exec(text);

    if (!match) {
      result.push(block);
      continue;
    }

    while (match) {
      const matchIndex = match.index;
      const textBefore = text.slice(0, matchIndex).trim();
      if (textBefore) {
        // Strip block backticks surrounding the iframe tag if present
        const cleanedBefore = textBefore.replace(/```html\s*$/i, '').replace(/```\s*$/i, '').trim();
        if (cleanedBefore) {
          result.push({ kind: 'text', content: cleanedBefore });
        }
      }

      const attrsStr = match[1];
      const src = match[2];

      const widthMatch = /width=["']([^"']+)["']/i.exec(attrsStr);
      const heightMatch = /height=["']([^"']+)["']/i.exec(attrsStr);
      const titleMatch = /title=["']([^"']+)["']/i.exec(attrsStr);

      result.push({
        kind: 'artifact',
        artifactType: 'iframe',
        title: titleMatch?.[1] || 'Embedded Video',
        props: {
          src,
          width: widthMatch?.[1] || '100%',
          height: heightMatch?.[1] || '400px',
        },
      });

      text = text.slice(matchIndex + match[0].length).trim();
      // Strip trailing code block marker if present
      text = text.replace(/^```/g, '').trim();
      match = IFRAME_RE.exec(text);
    }

    if (text) {
      result.push({ kind: 'text', content: text });
    }
  }

  return result;
}