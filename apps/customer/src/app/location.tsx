import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/launch-screen';
import { Icon } from '@/components/icon';
import { AppText, Button, Heading } from '@/components/ui';
import { useLocationContext } from '@/state/location-context';
import { colors, fonts } from '@/theme';

export default function LocationScreen() {
  const { promptSeen, status, canAskAgain, location, error, requestLocation, skipPrompt, openSettings } = useLocationContext();
  const [leaving, setLeaving] = useState(false);
  const insets = useSafeAreaInsets();
  const requesting = status === 'requesting';
  const needsSettings = status === 'denied' && !canAskAgain;

  useEffect(() => {
    if (!leaving || !promptSeen) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [leaving, promptSeen]);

  async function continueToApp() {
    await skipPrompt();
    setLeaving(true);
  }

  async function locate() {
    if (await requestLocation()) setLeaving(true);
  }

  return <View style={{ flex: 1, backgroundColor: colors.white }}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 28, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: 24 }}>
        <BrandMark size={66} />
        <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: colors.meadow, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 104, height: 104, borderRadius: 52, borderWidth: 1, borderColor: '#CADCCD', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: colors.pine, alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={32} color={colors.white} /></View>
          </View>
        </View>
      </View>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Heading size={27} style={{ textAlign: 'center', lineHeight: 35 }}>{location ? 'Your location is ready' : 'A little closer to Vagamon'}</Heading>
        <AppText style={{ color: colors.fern, textAlign: 'center', lineHeight: 23, maxWidth: 340 }}>
          {location ? location.label : 'Use your location to see approximately how far you are from Vagamon while you explore stays.'}
        </AppText>
        {location ? <AppText style={{ fontSize: 11, lineHeight: 18, color: colors.fern, textAlign: 'center' }}>Approximate straight-line distance, not driving distance.</AppText> : null}
      </View>
      <View style={{ padding: 16, borderRadius: 14, backgroundColor: colors.mist, borderWidth: 1, borderColor: colors.stone, gap: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Icon name="check" size={16} /><AppText style={{ fontSize: 12 }}>Only when you choose to share it</AppText></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Icon name="check" size={16} /><AppText style={{ fontSize: 12 }}>No background tracking</AppText></View>
        <AppText style={{ fontSize: 11, lineHeight: 18, color: colors.fern }}>Your approximate location stays in this app session. VagaGo does not save or upload your coordinates.</AppText>
      </View>
      {error ? <Text selectable accessibilityRole="alert" accessibilityLiveRegion="polite"
        style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, color: colors.error }}>{error}</Text> : null}
    </ScrollView>
    <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16), borderTopWidth: 1, borderColor: colors.stone, gap: 8 }}>
      <Button label={requesting ? 'Finding your location…' : needsSettings ? 'Open location settings' : location ? 'Refresh my location' : 'Use my location'}
        onPress={() => { void (needsSettings ? openSettings() : locate()); }} disabled={requesting} icon="pin" />
      <Pressable accessibilityRole="button" accessibilityLabel={location || error ? 'Continue to stays' : 'Not now'} onPress={() => { void continueToApp(); }}
        style={({ pressed }) => ({ minHeight: 48, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{location || error ? 'Continue to stays' : 'Not now'}</AppText>
      </Pressable>
    </View>
  </View>;
}
