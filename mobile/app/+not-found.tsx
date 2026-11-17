import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { fonts } from '@/lib/fonts';
import { useTheme } from '@/lib/theme';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.paper }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: colors.ink }}>This screen doesn't exist.</Text>
        <Link href="/" style={{ marginTop: 16, fontFamily: fonts.semibold, color: colors.primary }}>Go home</Link>
      </View>
    </>
  );
}
