import { memo, useMemo, useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { imageSource } from '../../lib/data';
import { fonts } from '../../lib/fonts';
import { fontSize as fs, radius, space, useTheme, type Colors } from '../../lib/theme';
import { parseMarkdown, type Block, type Inline } from './parse';

export interface MarkdownProps {
  md: string;
  highlight?: string;
  /** y is relative to the Markdown container; add the container's own offset in the screen */
  onHeadingLayout?: (id: string, y: number) => void;
  compact?: boolean;
}

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

function openLink(href: string) {
  if (/^https?:\/\//i.test(href)) WebBrowser.openBrowserAsync(href).catch(() => Linking.openURL(href).catch(() => {}));
  else if (/^(mailto:|tel:)/i.test(href)) Linking.openURL(href).catch(() => {});
}

function makeStyles(c: Colors, compact: boolean) {
  const k = compact ? 0.92 : 1;
  const base = Math.round(fs.md * k);
  const lh = Math.round(base * 1.45);
  const h = (size: number): TextStyle => ({ fontFamily: fonts.bold, fontSize: Math.round(size * k), lineHeight: Math.round(size * k * 1.25), color: c.ink });
  return StyleSheet.create({
    root: { gap: compact ? space.sm : space.md },
    p: { fontFamily: fonts.regular, fontSize: base, lineHeight: lh, color: c.ink },
    h1: { ...h(fs.xxl), marginTop: space.sm },
    h2: { ...h(fs.xl), marginTop: space.sm },
    h3: { ...h(fs.lg), marginTop: space.xs },
    h4: { ...h(fs.md), fontFamily: fonts.semibold },
    bold: { fontFamily: fonts.bold },
    italic: { fontStyle: 'italic' },
    mark: { backgroundColor: c.warnBg, color: c.ink },
    hit: { backgroundColor: c.gold, color: '#1b2430' },
    link: { color: c.primary, textDecorationLine: 'underline' },
    code: { fontFamily: MONO, fontSize: Math.round(base * 0.9), backgroundColor: c.card2, color: c.ink },
    tag: { fontFamily: fonts.semibold, fontSize: Math.round(base * 0.8), color: c.primary },
    wiki: { fontFamily: fonts.bold },
    pre: { backgroundColor: c.card2, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.line, padding: space.md },
    preText: { fontFamily: MONO, fontSize: Math.round(fs.sm * k), lineHeight: Math.round(fs.sm * k * 1.5), color: c.ink },
    quote: { borderLeftWidth: 3, borderLeftColor: c.line, paddingLeft: space.md, gap: space.xs },
    callout: { borderLeftWidth: 3, borderLeftColor: c.primary, backgroundColor: c.primaryBg, borderRadius: radius.sm, padding: space.md, gap: space.xs },
    calloutTitle: { fontFamily: fonts.bold, fontSize: Math.round(fs.sm * k), color: c.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
    li: { flexDirection: 'row', alignItems: 'flex-start' },
    marker: { fontFamily: fonts.regular, fontSize: base, lineHeight: lh, color: c.grey, width: 22 },
    liBody: { flex: 1, gap: space.xs },
    table: { borderWidth: StyleSheet.hairlineWidth, borderColor: c.line, borderRadius: radius.sm, overflow: 'hidden' },
    tr: { flexDirection: 'row' },
    th: { backgroundColor: c.card2 },
    cell: { width: 140, padding: space.sm, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
    cellText: { fontFamily: fonts.regular, fontSize: Math.round(fs.sm * k), lineHeight: Math.round(fs.sm * k * 1.4), color: c.ink },
    cellHead: { fontFamily: fonts.semibold },
    hr: { height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginVertical: space.xs },
    img: { width: '100%', borderRadius: radius.sm, backgroundColor: c.card2 },
  });
}
type Styles = ReturnType<typeof makeStyles>;

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function renderInline(nodes: Inline[], st: Styles, hl: RegExp | null, imagesAsAlt = true): ReactNode[] {
  return nodes.map((n, i): ReactNode => {
    switch (n.t) {
      case 'text': {
        if (!hl) return n.v;
        return n.v.split(hl).map((part, j) => (j % 2 ? <Text key={`${i}-${j}`} style={st.hit}>{part}</Text> : part));
      }
      case 'code': return <Text key={i} style={st.code}>{n.v}</Text>;
      case 'bold': return <Text key={i} style={st.bold}>{renderInline(n.c, st, hl, imagesAsAlt)}</Text>;
      case 'italic': return <Text key={i} style={st.italic}>{renderInline(n.c, st, hl, imagesAsAlt)}</Text>;
      case 'mark': return <Text key={i} style={st.mark}>{renderInline(n.c, st, hl, imagesAsAlt)}</Text>;
      case 'link': return <Text key={i} style={st.link} onPress={() => openLink(n.href)}>{renderInline(n.c, st, hl, imagesAsAlt)}</Text>;
      case 'tag': return <Text key={i} style={st.tag}>{n.v}</Text>;
      case 'wiki': return <Text key={i} style={st.wiki}>{n.v}</Text>;
      case 'image': return imagesAsAlt ? <Text key={i}>{n.alt ? `[${n.alt}]` : ''}</Text> : null;
    }
  });
}

function ImageBlock({ src, alt, st }: { src: NonNullable<ReturnType<typeof imageSource>>; alt: string; st: Styles }) {
  const [ratio, setRatio] = useState(16 / 9);
  return (
    <Image
      source={src}
      accessibilityLabel={alt || undefined}
      contentFit="contain"
      style={[st.img, { aspectRatio: ratio }]}
      onLoad={e => { const { width, height } = e.source; if (width && height) setRatio(width / height); }}
    />
  );
}

/** Inline content that may contain images: text runs become Text, images become image blocks. */
function Rich({ nodes, st, hl, textStyle }: { nodes: Inline[]; st: Styles; hl: RegExp | null; textStyle?: TextStyle }) {
  if (!nodes.some(n => n.t === 'image')) return <Text style={[st.p, textStyle]}>{renderInline(nodes, st, hl)}</Text>;
  const out: ReactNode[] = []; let run: Inline[] = [];
  const flush = () => {
    if (run.some(n => n.t !== 'text' || n.v.trim())) out.push(<Text key={`t${out.length}`} style={[st.p, textStyle]}>{renderInline(run, st, hl)}</Text>);
    run = [];
  };
  nodes.forEach(n => {
    if (n.t !== 'image') { run.push(n); return; }
    flush();
    const src = imageSource(n.key);
    if (src) out.push(<ImageBlock key={`i${out.length}`} src={src} alt={n.alt} st={st} />);
  });
  flush();
  return <View style={{ gap: space.sm }}>{out}</View>;
}

const BULLETS = ['•', '◦', '▪'];

function BlockView({ b, st, hl, onHeadingLayout }: { b: Block; st: Styles; hl: RegExp | null; onHeadingLayout?: MarkdownProps['onHeadingLayout'] }) {
  switch (b.t) {
    case 'heading':
      return (
        <View onLayout={e => onHeadingLayout?.(b.id, e.nativeEvent.layout.y)}>
          <Text accessibilityRole="header" style={st[`h${b.level}` as 'h1']}>{renderInline(b.c, st, hl)}</Text>
        </View>
      );
    case 'p': return <Rich nodes={b.c} st={st} hl={hl} />;
    case 'code':
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.pre}>
          <Text selectable style={st.preText}>{b.v}</Text>
        </ScrollView>
      );
    case 'list':
      return (
        <View style={{ gap: space.xs }}>
          {b.items.map((it, i) => (
            <View key={i} style={[st.li, { marginLeft: it.depth * space.lg }]}>
              <Text style={st.marker}>{it.ordered ? `${it.num}.` : BULLETS[it.depth % 3]}</Text>
              <View style={st.liBody}>
                <Rich nodes={it.c} st={st} hl={hl} />
                {it.extra.map((x, j) => <Rich key={j} nodes={x} st={st} hl={hl} />)}
              </View>
            </View>
          ))}
        </View>
      );
    case 'quote':
      return (
        <View style={b.callout ? st.callout : st.quote}>
          {b.callout ? <Text style={st.calloutTitle}>{b.callout}</Text> : null}
          {b.lines.map((l, i) => <Rich key={i} nodes={l} st={st} hl={hl} textStyle={b.callout ? undefined : { color: undefined, opacity: 0.85 }} />)}
        </View>
      );
    case 'table': {
      const row = (cs: Inline[][], head: boolean, key: string | number) => (
        <View key={key} style={[st.tr, head && st.th]}>
          {cs.map((c, i) => <View key={i} style={st.cell}><Text style={[st.cellText, head && st.cellHead]}>{renderInline(c, st, hl)}</Text></View>)}
        </View>
      );
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={st.table}>{row(b.head, true, 'h')}{b.rows.map((r, i) => row(r, false, i))}</View>
        </ScrollView>
      );
    }
    case 'hr': return <View style={st.hr} />;
  }
}

function MarkdownImpl({ md, highlight, onHeadingLayout, compact = false }: MarkdownProps) {
  const { colors } = useTheme();
  const blocks = useMemo(() => parseMarkdown(md), [md]);
  const st = useMemo(() => makeStyles(colors, compact), [colors, compact]);
  const hl = useMemo(() => { const q = highlight?.trim(); return q ? new RegExp(`(${escapeRe(q)})`, 'i') : null; }, [highlight]);
  return (
    <View style={st.root}>
      {blocks.map((b, i) => <BlockView key={i} b={b} st={st} hl={hl} onHeadingLayout={onHeadingLayout} />)}
    </View>
  );
}

export const Markdown = memo(MarkdownImpl);
export default Markdown;
