// Mini markdown parser, ported from web/app.js (renderMd + inline) into a block AST.
import { slug } from '../../lib/logic/notes';

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'bold'; c: Inline[] }
  | { t: 'italic'; c: Inline[] }
  | { t: 'mark'; c: Inline[] }
  | { t: 'link'; href: string; c: Inline[] }
  | { t: 'tag'; v: string }
  | { t: 'wiki'; v: string }
  | { t: 'image'; alt: string; key: string };

export interface ListItem { depth: number; ordered: boolean; num: number; c: Inline[]; extra: Inline[][] }

export type Block =
  | { t: 'heading'; level: 1 | 2 | 3 | 4; id: string; c: Inline[] }
  | { t: 'p'; c: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'list'; items: ListItem[] }
  | { t: 'quote'; callout?: string; lines: Inline[][] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'hr' };

type Pat = { re: RegExp; make: (m: RegExpExecArray) => Inline; boundary?: boolean };

const PATTERNS: Pat[] = [
  { re: /!\[([^\]]*)\]\(([^)]+)\)/g, make: m => ({ t: 'image', alt: m[1], key: m[2].trim() }) },
  { re: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, make: m => ({ t: 'wiki', v: m[2] || m[1] }) },
  { re: /\[([^\]]+)\]\(([^)]+)\)/g, make: m => ({ t: 'link', href: m[2].trim(), c: parseInline(m[1]) }) },
  { re: /`([^`]+)`/g, make: m => ({ t: 'code', v: m[1] }) },
  { re: /\*\*([^*]+)\*\*/g, make: m => ({ t: 'bold', c: parseInline(m[1]) }) },
  { re: /\*([^*\s][^*]*)\*/g, make: m => ({ t: 'italic', c: parseInline(m[1]) }) },
  { re: /==([^=]+)==/g, make: m => ({ t: 'mark', c: parseInline(m[1]) }) },
  { re: /#([a-zA-Z][\w-]*)/g, make: m => ({ t: 'tag', v: '#' + m[1] }), boundary: true },
  { re: /https?:\/\/[^\s<)]+/g, make: m => { const u = m[0].replace(/[.,;:!?]+$/, ''); return { t: 'link', href: u, c: [{ t: 'text', v: u }] }; }, boundary: true },
];

function find(p: Pat, s: string, pos: number): RegExpExecArray | null {
  p.re.lastIndex = pos;
  for (;;) {
    const m = p.re.exec(s);
    if (!m) return null;
    if (!p.boundary || m.index === 0 || /[\s(]/.test(s[m.index - 1])) return m;
    p.re.lastIndex = m.index + 1;
  }
}

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let pos = 0;
  const pushText = (v: string) => { if (v) out.push({ t: 'text', v }); };
  while (pos < s.length) {
    let best: { m: RegExpExecArray; p: Pat } | null = null;
    for (const p of PATTERNS) {
      const m = find(p, s, pos);
      if (m && (!best || m.index < best.m.index)) best = { m, p };
    }
    if (!best) { pushText(s.slice(pos)); break; }
    pushText(s.slice(pos, best.m.index));
    const node = best.p.make(best.m);
    out.push(node);
    // bare URLs may have trailing punctuation trimmed: resume after the consumed part only
    pos = best.m.index + (node.t === 'link' && best.p.boundary ? (node.c[0] as { v: string }).v.length : best.m[0].length);
  }
  return out;
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l: string) => /^\s*\|?[\s:-]+\|/.test(l || '');
const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => parseInline(c.trim()));

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let list: ListItem[] | null = null;
  const counters: number[] = [];
  const closeList = () => { list = null; counters.length = 0; };
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      closeList(); const buf: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      blocks.push({ t: 'code', v: buf.join('\n') }); i++; continue;
    }
    const h = line.match(/^(#{1,4})\s+(.+)/);
    if (h) { closeList(); blocks.push({ t: 'heading', level: h[1].length as 1 | 2 | 3 | 4, id: slug(h[2]), c: parseInline(h[2].trim()) }); i++; continue; }
    if (isTableRow(line) && isTableSep(lines[i + 1])) {
      closeList();
      const head = cells(line); const rows: Inline[][][] = []; i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push({ t: 'table', head, rows }); continue;
    }
    if (/^\s*>/.test(line)) {
      closeList(); const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
      let callout: string | undefined;
      const first = buf[0]?.match(/^\[!(\w+)\][+-]?\s*(.*)$/);
      if (first) { callout = first[1].toLowerCase(); buf[0] = first[2]; }
      const ls = buf.map(parseInline);
      blocks.push({ t: 'quote', callout, lines: callout && !buf[0] ? ls.slice(1) : ls }); continue;
    }
    const li = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)/);
    if (li) {
      const depth = Math.floor(li[1].replace(/\t/g, '    ').length / 2);
      const ordered = /\d/.test(li[2]);
      if (!list) { const items: ListItem[] = []; list = items; blocks.push({ t: 'list', items }); }
      counters.length = depth + 1;
      counters[depth] = (counters[depth] || 0) + 1;
      list.push({ depth, ordered, num: counters[depth], c: parseInline(li[3]), extra: [] });
      i++; continue;
    }
    if (!line.trim()) { closeList(); i++; continue; }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeList(); blocks.push({ t: 'hr' }); i++; continue; }
    if (/^\s+\S/.test(line) && list && (list as ListItem[]).length) { (list as ListItem[])[(list as ListItem[]).length - 1].extra.push(parseInline(line.trim())); i++; continue; }
    closeList();
    blocks.push({ t: 'p', c: parseInline(line) }); i++;
  }
  return blocks;
}
