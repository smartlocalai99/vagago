import { useRef, useState } from 'react';
import { AccessibilityInfo, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateGetawayDraft } from '@vagago/domain';
import { DateRange } from '@/components/date-range';
import { Icon } from '@/components/icon';
import { AppText, Button, Heading } from '@/components/ui';
import { matchStays } from '@/data/search';
import { useStays } from '@/state/catalog-context';
import { useEscape } from '@/state/escape-context';
import { createDefaultDraft } from '@/state/storage-records';
import { colors, fonts } from '@/theme';
import type { EscapeDraft } from '@/types';

export default function SearchScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const editingBooking = returnTo === 'review';
  const { draft, updateDraft } = useEscape();
  const stays = useStays();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const [pending, setPending] = useState<EscapeDraft>(() => ({ ...draft, mood: null }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const matches = matchStays(stays, pending);

  function change(patch: Partial<EscapeDraft>) {
    setPending((current) => ({ ...current, ...patch }));
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !(key in patch))));
  }

  function reset() {
    const defaults = createDefaultDraft();
    const withCurrentDates = { ...defaults, checkIn: pending.checkIn, checkOut: pending.checkOut };
    setPending(validateGetawayDraft(withCurrentDates).valid ? withCurrentDates : defaults);
    setErrors({});
    Keyboard.dismiss();
    AccessibilityInfo.announceForAccessibility('Search reset.');
  }

  function showStays() {
    Keyboard.dismiss();
    const criteria = { ...pending, query: pending.query.trim(), mood: null };
    const result = validateGetawayDraft(criteria);
    setErrors(result.errors);
    if (!result.valid) {
      AccessibilityInfo.announceForAccessibility('Check your search details before continuing.');
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const next = { ...criteria, stayId: editingBooking ? draft.stayId : null, roomOptionId: editingBooking ? draft.roomOptionId : null, roomCount: 1 };
    updateDraft(next);
    if (editingBooking) router.dismissTo('/review');
    else router.dismissTo('/');
  }

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }}
    behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={insets.top + 48}>
    <Stack.Screen options={{ title: editingBooking ? 'Dates & guests' : 'Search stays' }} />
    <ScrollView ref={scroll} style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      contentContainerStyle={{ padding: 20, paddingBottom: 28, gap: 26 }}>
      {!editingBooking ? <View style={{ gap: 12 }}>
        <Heading size={18}>Where to?</Heading>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
          borderWidth: 1, borderColor: colors.stone, borderRadius: 14, backgroundColor: colors.mist }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.meadow,
            alignItems: 'center', justifyContent: 'center' }}><Icon name="pin" size={21} /></View>
          <View style={{ flex: 1, gap: 1 }}>
            <AppText style={{ fontFamily: fonts.bold, fontSize: 15 }}>Vagamon, Kerala</AppText>
            <AppText style={{ color: colors.fern, fontSize: 12, lineHeight: 19 }}>All VagaGo stays are in Vagamon</AppText>
          </View>
          <Icon name="check" size={19} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13,
          borderWidth: 1, borderColor: colors.stone, borderRadius: 12, gap: 9 }}>
          <Icon name="search" size={19} color={colors.fern} />
          <TextInput accessibilityLabel="Stay name or keyword" placeholder="Search stays in Vagamon"
            placeholderTextColor={colors.fern} value={pending.query} onChangeText={(query) => change({ query })}
            autoCapitalize="none" autoCorrect={false} maxLength={120} returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss} style={{ flex: 1, minHeight: 50, paddingVertical: 12,
              fontFamily: fonts.regular, fontSize: 13, color: colors.ink }} />
          {pending.query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear stay search"
            onPress={() => change({ query: '' })} hitSlop={8} style={{ minHeight: 44, width: 32,
              alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={17} /></Pressable> : null}
        </View>
      </View> : null}

      <View style={{ gap: 12 }}>
        <Heading size={18}>When</Heading>
        <DateRange checkIn={pending.checkIn} checkOut={pending.checkOut} onChange={change} errors={errors} />
        <AppText style={{ fontSize: 11, lineHeight: 18, color: colors.fern }}>Choose your check-in and check-out dates.</AppText>
      </View>

      <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.stone,
        paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ gap: 4, flex: 1 }}>
          <Heading size={18}>Guests</Heading>
          <AppText style={{ color: colors.fern, fontSize: 12, lineHeight: 19 }}>Total guests staying</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          {([-1, 1] as const).map((direction) => {
            const disabled = direction === -1 ? pending.guests <= 1 : pending.guests >= 12;
            const control = <Pressable key={direction} accessibilityRole="button"
              accessibilityLabel={direction === -1 ? 'Remove one guest' : 'Add one guest'}
              accessibilityState={{ disabled }} disabled={disabled}
              onPress={() => change({ guests: pending.guests + direction })}
              style={({ pressed }) => ({ width: 44, height: 44, borderWidth: 1, borderColor: colors.stone,
                borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                opacity: disabled ? 0.3 : pressed ? 0.6 : 1 })}>
              <Icon name={direction === -1 ? 'minus' : 'plus'} size={17} />
            </Pressable>;
            return direction === -1 ? <View key={direction} style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              {control}<Text accessibilityLabel={`${pending.guests} guests`} accessibilityLiveRegion="polite"
                style={{ minWidth: 18, textAlign: 'center', color: colors.ink, fontFamily: fonts.semibold,
                  fontSize: 16, fontVariant: ['tabular-nums'] }}>{pending.guests}</Text>
            </View> : control;
          })}
        </View>
      </View>


      {Object.entries(errors).filter(([key]) => key !== 'checkIn' && key !== 'checkOut').map(([key, message]) =>
        <Text key={key} selectable accessibilityRole="alert" accessibilityLiveRegion="polite"
          style={{ color: colors.error, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 }}>{message}</Text>)}
    </ScrollView>

    <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16),
      backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.stone, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Reset search" onPress={reset}
          style={({ pressed }) => ({ minHeight: 50, justifyContent: 'center', paddingRight: 6, opacity: pressed ? 0.6 : 1 })}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, textDecorationLine: 'underline' }}>Reset</AppText>
        </Pressable>
        <Button label={editingBooking ? 'Update booking' : 'Search stays'} icon={editingBooking ? 'check' : 'search'} onPress={showStays} style={{ flex: 1 }} />
      </View>
      <AppText style={{ color: colors.fern, textAlign: 'center', fontSize: 11, lineHeight: 16 }}>
        {editingBooking ? 'Updates apply to your selected stay' : `${matches.length} matching ${matches.length === 1 ? 'stay' : 'stays'}`}
      </AppText>
    </View>
  </KeyboardAvoidingView>;
}
