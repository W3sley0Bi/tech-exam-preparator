import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Maximize2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { imageSource } from '@/lib/data';
import { useTheme } from '@/lib/theme';
import * as haptics from '@/lib/haptics';

function Viewer({ source, onClose, alt }: { source: number | { uri: string }; onClose: () => void; alt: string }) {
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewerBg}>
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={{ width: Platform.OS === 'web' ? '100%' : width, minHeight: height, justifyContent: 'center' }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom
        >
          <Pressable onPress={onClose} accessibilityLabel={alt}>
            <View style={[styles.viewerImgWrap, { height: height * 0.8 }]}>
              <Image source={source} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel={alt} />
            </View>
          </Pressable>
        </ScrollView>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12} style={styles.viewerClose}>
          <X size={22} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

/** one tappable image (white background, aspect from natural size, fullscreen zoom viewer on tap) */
export function QuestionImage({ imgKey, alt }: { imgKey: string; alt?: string }) {
  const { colors, radius } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [ratio, setRatio] = useState(16 / 9);
  const source = imageSource(imgKey);
  if (!source) return null;
  const label = alt ?? t('question.questionImage');
  return (
    <>
      <Pressable
        onPress={() => { haptics.tap(); setOpen(true); }}
        accessibilityRole="imagebutton"
        accessibilityLabel={label}
        style={[styles.imgBox, { borderColor: colors.line, borderRadius: radius.md, aspectRatio: ratio }]}
      >
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          onLoad={e => { const { width, height } = e.source; if (width && height) setRatio(Math.min(Math.max(width / height, 0.5), 4)); }}
        />
        <View style={[styles.zoomHint, { backgroundColor: 'rgba(0,0,0,0.55)' }]}><Maximize2 size={14} color="#fff" /></View>
      </Pressable>
      {open ? <Viewer source={source} alt={label} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function QuestionImages({ keys, alt }: { keys: readonly string[]; alt?: string }) {
  if (!keys.length) return null;
  return <View style={styles.list}>{keys.map((k, i) => <QuestionImage key={`${k}-${i}`} imgKey={k} alt={alt} />)}</View>;
}

const styles = StyleSheet.create({
  list: { gap: 10, marginVertical: 6 },
  imgBox: { width: '100%', backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginVertical: 6 },
  zoomHint: { position: 'absolute', right: 8, bottom: 8, borderRadius: 999, padding: 6 },
  viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  viewerImgWrap: { width: '100%', backgroundColor: '#ffffff' },
  viewerClose: { position: 'absolute', top: 54, right: 18, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
});
