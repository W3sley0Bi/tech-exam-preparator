import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { CalendarDays, Download, Minus, Plus, RotateCcw, Upload } from 'lucide-react-native';
import { Button, Card, ListRow, ScreenScroll, SectionHeader, Segmented, Switch } from '@/components/ui';
import { Mascot } from '@/components/mascot';
import { confirmAction } from '@/components/exam/confirm';
import { ensurePermission } from '@/lib/notifications';
import { fonts } from '@/lib/fonts';
import * as haptics from '@/lib/haptics';
import { useSettings, useStore } from '@/lib/store';
import { fontSize, useTheme } from '@/lib/theme';

const web = Platform.OS === 'web';
const pad = (n: number) => String(n).padStart(2, '0');

function notify(title: string, body?: string) {
  if (web && typeof window !== 'undefined') window.alert(body ? `${title}\n\n${body}` : title);
  else Alert.alert(title, body);
}

function Stepper({ label, value, onChange }: { label: string; value: string; onChange: (d: number) => void }) {
  const { colors, radius } = useTheme();
  const btn = (Icon: typeof Plus, d: number, a: string) => (
    <Pressable
      accessibilityRole="button" accessibilityLabel={a} hitSlop={4}
      onPress={() => { haptics.select(); onChange(d); }}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Icon size={18} color={colors.ink} strokeWidth={2.5} />
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {btn(Plus, 1, `${label} +`)}
      <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.ink, minWidth: 44, textAlign: 'center' }}>{value}</Text>
      {btn(Minus, -1, `${label} -`)}
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, space } = useTheme();
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const set = useStore((s) => s.setSettings);

  const toggleReminder = async (v: boolean) => {
    if (v) {
      const ok = await ensurePermission();
      if (!ok) { notify(t('settings.reminders'), t('settings.reminderDenied')); set({ reminderEnabled: false }); return; }
    }
    set({ reminderEnabled: v });
  };

  const doExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const json = useStore.getState().exportState();
      const name = `az900-progress-${new Date().toISOString().slice(0, 10)}.json`;
      if (web) {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const f = new File(Paths.cache, name);
        if (f.exists) f.delete();
        f.create();
        f.write(json);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: t('settings.export') });
      }
      haptics.success();
    } catch (e) {
      notify(t('common.error'), String((e as Error)?.message ?? e));
    } finally { setBusy(false); }
  };

  const doImport = async () => {
    if (busy) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const text = web
        ? await (asset.file ? asset.file.text() : fetch(asset.uri).then((r) => r.text()))
        : await new File(asset.uri).text();
      confirmAction(t('settings.importConfirmTitle'), t('settings.importConfirmBody'), t('common.import'), t('common.cancel'), () => {
        const r = useStore.getState().importState(text);
        if (r.ok) { haptics.success(); notify(t('settings.importOk')); }
        else { haptics.error(); notify(t('settings.importError'), r.error); }
      });
    } catch {
      haptics.error();
      notify(t('settings.importError'));
    }
  };

  const doReset = () => confirmAction(t('settings.resetTitle'), t('settings.resetBody'), t('common.reset'), t('common.cancel'), () => {
    useStore.getState().resetAll();
    haptics.success();
    notify(t('settings.resetDone'));
  }, true);

  const stepHour = (d: number) => set({ reminderHour: (settings.reminderHour + d + 24) % 24 });
  const stepMinute = (d: number) => set({ reminderMinute: (settings.reminderMinute + d * 5 + 60) % 60 });
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScreenScroll>
      <SectionHeader title={t('settings.reminders')} />
      <Card style={{ gap: space.lg }}>
        <Switch label={t('settings.reminderEnabled')} value={settings.reminderEnabled} onChange={toggleReminder} />
        {settings.reminderEnabled ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.ink }}>{t('settings.reminderTime')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Stepper label="Hour" value={pad(settings.reminderHour)} onChange={stepHour} />
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.ink }}>:</Text>
              <Stepper label="Minute" value={pad(settings.reminderMinute)} onChange={stepMinute} />
            </View>
          </View>
        ) : null}
      </Card>

      <SectionHeader title={t('settings.appearance')} />
      <Card>
        <Segmented
          options={[
            { value: 'dark', label: t('settings.appearanceDark') },
            { value: 'light', label: t('settings.appearanceLight') },
            { value: 'system', label: t('settings.appearanceSystem') },
          ]}
          value={settings.appearance ?? 'dark'}
          onChange={(v) => { haptics.select(); set({ appearance: v as 'dark' | 'light' | 'system' }); }}
        />
      </Card>

      <SectionHeader title={t('settings.feedback')} />
      <Card>
        <Switch label={t('settings.haptics')} value={settings.haptics} onChange={(v) => set({ haptics: v })} />
      </Card>

      <SectionHeader title={t('settings.plan')} />
      <Card style={{ paddingVertical: space.xs }}>
        <ListRow icon={CalendarDays} title={t('plan.examDate')} subtitle={t('plan.settingsHeading')} onPress={() => router.push('/plan' as never)} />
      </Card>

      <SectionHeader title={t('settings.data')} />
      <Card style={{ gap: space.md }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey }}>
          JSON, compatible with the web app's export.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Button title={t('common.export')} icon={Download} variant="secondary" disabled={busy} onPress={doExport} />
          <Button title={t('common.import')} icon={Upload} variant="secondary" disabled={busy} onPress={doImport} />
        </View>
        <Button title={t('settings.reset')} icon={RotateCcw} variant="danger" onPress={doReset} />
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card style={{ alignItems: 'center', gap: space.sm }}>
        <Mascot mood="happy" size={96} />
        <Text style={{ fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.ink }}>{t('mascot.name')}</Text>
        <Text style={{ fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.grey }}>{t('settings.version', { v: version })}</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.grey, textAlign: 'center', lineHeight: 19 }}>
          Examprepper questions · your Obsidian notes · Microsoft Learn skills outline
        </Text>
      </Card>
    </ScreenScroll>
  );
}
