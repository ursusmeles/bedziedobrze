import { parse } from 'parse5';

const excluded = new Set(['head', 'script', 'style', 'pre', 'code', 'kbd', 'samp',
  'textarea', 'input', 'select', 'option', 'svg', 'math', 'template', 'iframe']);
const boundaries = new Set(['address', 'article', 'aside', 'blockquote', 'br', 'button',
  'dd', 'details', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'img', 'li', 'main',
  'nav', 'ol', 'p', 'section', 'summary', 'table', 'tbody', 'td', 'th', 'tr', 'ul']);

/** Bind Polish one-letter words in body text while preserving the original HTML. */
export function polishTypography(html) {
  const document = parse(html, { sourceCodeLocationInfo: true, scriptingEnabled: false });
  const root = document.childNodes.find(node => node.tagName === 'html');
  const language = root?.attrs.find(attr => attr.name === 'lang')?.value;
  if (language && !/^pl(?:-|$)/i.test(language)) return html;
  const body = root?.childNodes.find(node => node.tagName === 'body');
  if (!body) return html;

  const edits = [];
  let run = [];

  function flush() {
    let offset = 0;
    const chunks = run.map(node => {
      const start = offset;
      const location = node.sourceCodeLocation;
      const text = html.slice(location.startOffset, location.endOffset);
      offset += text.length;
      return { start, end: offset, source: location.startOffset, text };
    });
    const text = chunks.map(chunk => chunk.text).join('');
    // Unicode boundaries avoid matching the end of a longer word or a URL.
    const words = /(?<![\p{L}\p{N}\p{M}_/@:.-])([aoiuwz])([ \t\r\n\f]+)(?=[\p{L}\p{N}„“«"'(\[])/giu;
    for (const match of text.matchAll(words)) {
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      for (const chunk of chunks) {
        const from = Math.max(start, chunk.start);
        const to = Math.min(end, chunk.end);
        if (from < to) edits.push({
          start: chunk.source + from - chunk.start,
          end: chunk.source + to - chunk.start,
          value: from === start ? '\u00a0' : '',
        });
      }
    }
    run = [];
  }

  function visit(node) {
    if (node.nodeName === '#text' && node.sourceCodeLocation) {
      run.push(node);
      return;
    }
    if (node.nodeName === '#comment') return;
    const attrs = new Map((node.attrs ?? []).map(attr => [attr.name, attr.value]));
    const language = attrs.get('lang');
    if (excluded.has(node.tagName) || attrs.get('data-typography') === 'off'
      || attrs.get('translate') === 'no'
      || (attrs.has('contenteditable') && attrs.get('contenteditable') !== 'false')
      || (language && !/^pl(?:-|$)/i.test(language))) {
      flush();
      return;
    }
    const boundary = boundaries.has(node.tagName);
    if (boundary) flush();
    for (const child of node.childNodes ?? []) visit(child);
    if (boundary) flush();
  }

  visit(body);
  flush();
  // Offset-based edits leave attributes, entities, scripts, and tag syntax intact.
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    html = html.slice(0, edit.start) + edit.value + html.slice(edit.end);
  }
  return html;
}
