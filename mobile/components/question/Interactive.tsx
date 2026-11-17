import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { IxItem, Question } from '@/lib/types';
import { useTheme } from '@/lib/theme';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';

type Sel = readonly (string | null)[];

function OptionSheet({ title, options, current, onPick, onClose }: { title: string; options: string[]; current: string | null; onPick: (o: string) => void; onClose: () => void }) {
  const { colors, radius, fontSize } = useTheme();
  const { t } = useTranslation();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.close')} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
          <View style={[styles.grabber, { backgroundColor: colors.line }]} />
          <View style={styles.sheetHead}>
            <Text numberOfLines={2} style={{ flex: 1, color: colors.ink, fontFamily: fonts.semibold, fontSize: fontSize.md }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel={t('common.close')}><X size={22} color={colors.grey} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
            {options.map(o => {
              const on = o === current;
              return (
                <Pressable key={o} onPress={() => { haptics.select(); onPick(o); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={({ pressed }) => [styles.opt, { backgroundColor: on ? colors.primaryBg : pressed ? colors.card2 : 'transparent', borderTopColor: colors.line }]}>
                  <Text style={{ flex: 1, color: on ? colors.primary : colors.ink, fontFamily: on ? fonts.semibold : fonts.regular, fontSize: fontSize.md, lineHeight: 22 }}>{o}</Text>
                  {on && <Check size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SelectField({ item, v, revealed, onPick, inline }: { item: IxItem; v: string | null; revealed: boolean; onPick: (o: string) => void; inline?: boolean }) {
  const { colors, radius, fontSize } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ok = v === item.answer;
  const border = revealed ? (ok ? colors.ok : colors.danger) : v ? colors.primary : colors.line;
  const bg = revealed ? (ok ? colors.okBg : colors.dangerBg) : v ? colors.primaryBg : colors.card;
  return (
    <>
      <Pressable disabled={revealed} onPress={() => { haptics.tap(); setOpen(true); }} accessibilityRole="button"
        style={[styles.field, { borderColor: border, backgroundColor: bg, borderRadius: radius.md }, inline && { alignSelf: 'flex-start', marginVertical: 4 }]}>
        <Text numberOfLines={3} style={{ flex: inline ? undefined : 1, flexShrink: 1, color: v ? colors.ink : colors.grey, fontFamily: v ? fonts.medium : fonts.regular, fontSize: fontSize.md }}>{v ?? t('question.select')}</Text>
        {!revealed && <ChevronDown size={18} color={colors.grey} />}
      </Pressable>
      {open && <OptionSheet title={item.label.replace('___', '…')} options={item.options} current={v} onClose={() => setOpen(false)} onPick={o => { setOpen(false); onPick(o); }} />}
    </>
  );
}

function Mark({ ok, answer }: { ok: boolean; answer: string }) {
  const { colors, fontSize } = useTheme();
  return ok
    ? <View style={styles.mark}><Check size={18} color={colors.ok} /></View>
    : <View style={styles.mark}><X size={18} color={colors.danger} /><Text style={{ color: colors.danger, fontFamily: fonts.semibold, fontSize: fontSize.sm, flexShrink: 1 }}>{answer}</Text></View>;
}

export function Interactive({ q, value, onChange, revealed }: { q: Question; value: Sel; onChange: (v: (string | null)[]) => void; revealed: boolean }) {
  const { colors, radius, fontSize } = useTheme();
  const { t } = useTranslation();
  const ix = q.ix;
  if (!ix) return null;
  const sel = value as Sel;

  const prompt = ix.prompt ? <Text style={{ color: colors.grey, fontFamily: fonts.regular, fontSize: fontSize.sm, marginBottom: 4 }}>{ix.prompt}</Text> : null;

  if (ix.kind === 'multiselect') {
    const cur = sel.filter((x): x is string => x !== null);
    return (
      <View style={{ gap: 10 }}>
        {prompt}
        {ix.options.map(o => {
          const on = cur.includes(o), right = ix.answers.includes(o);
          let bg = on ? colors.primaryBg : colors.card, border = on ? colors.primary : colors.line, boxBg = on ? colors.primary : 'transparent', boxBorder = on ? colors.primary : colors.grey, icon = on ? <Check size={16} color="#fff" /> : null;
          if (revealed) {
            if (right) { bg = colors.okBg; border = colors.ok; boxBg = on ? colors.ok : 'transparent'; boxBorder = colors.ok; icon = on ? <Check size={16} color="#fff" /> : null; }
            else if (on) { bg = colors.dangerBg; border = colors.danger; boxBg = colors.danger; boxBorder = colors.danger; icon = <X size={16} color="#fff" />; }
          }
          return (
            <Animated.View key={o} layout={LinearTransition} entering={FadeIn}>
              <Pressable disabled={revealed} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                onPress={() => { haptics.select(); onChange(on ? cur.filter(x => x !== o) : [...cur, o]); }}
                style={[styles.row, { backgroundColor: bg, borderColor: border, borderRadius: radius.lg }]}>
                <View style={[styles.box, { backgroundColor: boxBg, borderColor: boxBorder, borderRadius: radius.sm }]}>{icon}</View>
                <Text style={{ flex: 1, color: colors.ink, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 22 }}>{o}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
        <Text style={{ color: colors.grey, fontFamily: fonts.medium, fontSize: fontSize.sm }}>{t('question.selectAll')}</Text>
      </View>
    );
  }

  const set = (i: number, v: string) => { const s = ix.items.map((_, j) => sel[j] ?? null); s[i] = v; onChange(s); };

  return (
    <View style={{ gap: 12 }}>
      {prompt}
      {ix.items.map((it, i) => {
        const v = sel[i] ?? null;
        const ok = v === it.answer;
        const wrap = [styles.item, { backgroundColor: colors.card, borderColor: colors.line, borderRadius: radius.lg }];
        if (ix.kind === 'yesno') {
          return (
            <View key={i} style={wrap}>
              <Text style={{ color: colors.ink, fontFamily: fonts.medium, fontSize: fontSize.md, lineHeight: 22 }}>{it.label}</Text>
              <View style={styles.seg}>
                {it.options.map(o => {
                  const on = v === o;
                  let bg = on ? colors.primary : colors.card2, fg = on ? colors.onPrimary : colors.ink, border = on ? colors.primary : colors.line;
                  if (revealed) {
                    if (o === it.answer) { bg = on ? colors.ok : colors.okBg; fg = on ? '#fff' : colors.ok; border = colors.ok; }
                    else if (on) { bg = colors.danger; fg = '#fff'; border = colors.danger; }
                    else { bg = colors.card2; fg = colors.grey; }
                  }
                  return (
                    <Pressable key={o} disabled={revealed} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { haptics.select(); set(i, o); }}
                      style={[styles.pill, { backgroundColor: bg, borderColor: border, borderRadius: radius.pill }]}>
                      <Text style={{ color: fg, fontFamily: fonts.semibold, fontSize: fontSize.md }}>{o}</Text>
                    </Pressable>
                  );
                })}
                {revealed && <Mark ok={ok} answer={it.answer} />}
              </View>
            </View>
          );
        }
        // dropdown / match
        if (ix.kind === 'dropdown' && it.label.includes('___')) {
          const [a, ...b] = it.label.split('___');
          return (
            <View key={i} style={wrap}>
              <View style={styles.inlineRow}>
                {a ? <Text style={[styles.inlineText, { color: colors.ink, fontFamily: fonts.medium, fontSize: fontSize.md }]}>{a}</Text> : null}
                <SelectField inline item={it} v={v} revealed={revealed} onPick={o => set(i, o)} />
                {b.join('___') ? <Text style={[styles.inlineText, { color: colors.ink, fontFamily: fonts.medium, fontSize: fontSize.md }]}>{b.join('___')}</Text> : null}
              </View>
              {revealed && <Mark ok={ok} answer={it.answer} />}
            </View>
          );
        }
        return (
          <View key={i} style={wrap}>
            <Text style={{ color: colors.ink, fontFamily: fonts.medium, fontSize: fontSize.md, lineHeight: 22 }}>{it.label}</Text>
            <SelectField item={it} v={v} revealed={revealed} onPick={o => set(i, o)} />
            {revealed && <Mark ok={ok} answer={it.answer} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { borderWidth: 1, padding: 14, gap: 10 },
  seg: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  pill: { minWidth: 84, minHeight: 48, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  field: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5 },
  inlineRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6 },
  inlineText: { lineHeight: 22 },
  mark: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1.5 },
  box: { width: 26, height: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '70%', width: '100%', maxWidth: 640, alignSelf: 'center' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10 },
  closeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  opt: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
