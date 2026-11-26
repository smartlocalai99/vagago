import { useCallback, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateGetawayDraft } from '@vagago/domain';
import { AppText, EmptyState, Heading, StayCard } from '@/components/ui';
import { Faq, PlacesRow, SectionTitle, WhyVagaGo } from '@/components/explore-sections';
import { DealCarousel } from '@/components/deal-carousel';
import { ease, LeaveListContext, Reveal, swap } from '@/components/motion';
import { Icon, type IconName } from '@/components/icon';
import { SortSheet } from '@/components/sort-sheet';
import { discountPercent, matchStays, sortOptions, sortStays, type SortId } from '@/data/search';
import { useCatalog } from '@/state/catalog-context';
import { useEscape } from '@/state/escape-context';
import { colors, fonts } from '@/theme';

function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? 'Add dates' : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}

function HeaderChip({ icon, label, accessibilityLabel, onPress, active = false, trailing }: { icon: IconName; label: string; accessibilityLabel: string; onPress: () => void; active?: boolean; trailing?: ReactNode }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: active ? colors.ink : colors.stone, backgroundColor: active ? colors.canvas : colors.white, opacity: pressed ? 0.6 : 1 })}>
    <Icon name={icon} size={16} color={colors.ink} />
    <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.ink }}>{label}</Text>
    {trailing}
  </Pressable>;
}

export default function Explore() {
  const { draft, updateDraft } = useEscape();
  const { stays, refreshing, refresh, error } = useCatalog();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<SortId>('recommended');
  const [sorting, setSorting] = useState(false);
  const results = sortStays(matchStays(stays, draft), sort);
  const deals = draft.query ? [] : results.filter((stay) => discountPercent(stay.nightlyRate, stay.compareAtRate) > 0)
    .sort((a, b) => discountPercent(b.nightlyRate, b.compareAtRate) - discountPercent(a.nightlyRate, a.compareAtRate) || a.nightlyRate - b.nightlyRate);
  // Opening a stay slides this screen slightly left while the stay page fades in; returning brings it back.
  const leave = useSharedValue(0);
  const leaveList = useCallback(() => leave.set(withTiming(-50, { duration: 340, easing: swap })), [leave]);
  useFocusEffect(useCallback(() => { leave.set(withTiming(0, { duration: 340, easing: ease })); }, [leave]));
  const leaveStyle = useAnimatedStyle(() => ({ transform: [{ translateX: leave.get() }] }));
  const valid = validateGetawayDraft(draft).valid;
  const editSearch = () => router.push('/search');
  const dates = `${shortDate(draft.checkIn)} – ${shortDate(draft.checkOut)}`;
  const guestsLabel = `${draft.guests} ${draft.guests === 1 ? 'guest' : 'guests'}`;
  const sortLabel = sortOptions.find((option) => option.id === sort)!.label;

  // The whole screen zooms in from the distance after launch, as in the reference.
  return <LeaveListContext value={leaveList}><Reveal from="zoom" duration={480} style={{ flex: 1, backgroundColor: colors.white }}><Animated.View style={[{ flex: 1 }, leaveStyle]}>
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.stone, gap: 12 }}>
      <View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.stone }}>
        <Icon name="search" size={20} color={colors.ink} />
        <TextInput accessibilityLabel="Search stays or places in Vagamon" placeholder="Search stays or places in Vagamon" placeholderTextColor={colors.fern}
          value={draft.query} onChangeText={(query) => updateDraft({ query })} maxLength={120} returnKeyType="search"
          autoCapitalize="none" autoCorrect={false} clearButtonMode="never" onSubmitEditing={Keyboard.dismiss}
          style={{ flex: 1, minHeight: 48, fontFamily: fonts.medium, fontSize: 15, color: colors.ink }} />
        {draft.query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => updateDraft({ query: '' })}
          style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={13} color={colors.ink} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <HeaderChip icon="sort" label={sort === 'recommended' ? 'Sort' : sortLabel} accessibilityLabel={`Sort stays, currently ${sortLabel}`} active={sort !== 'recommended'} onPress={() => { Keyboard.dismiss(); setSorting(true); }} />
        <HeaderChip icon="calendar" label={dates} accessibilityLabel={`Dates ${dates}, edit`} onPress={editSearch} />
        <HeaderChip icon="users" label={guestsLabel} accessibilityLabel={`${guestsLabel}, edit`} onPress={editSearch} />
      </ScrollView>
    </View>

    <ScrollView contentInsetAdjustmentBehavior="never" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.fern} />}>
      <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, gap: 4 }}>
        <Heading size={23}>Affordable stays at the best price</Heading>
        <Pressable accessibilityRole="button" accessibilityLabel={`Vagamon, ${dates}, ${guestsLabel}. Edit search`} onPress={editSearch}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 32, opacity: pressed ? 0.6 : 1 })}>
          <AppText style={{ color: colors.fern, fontSize: 14 }}>Vagamon · {dates} · {guestsLabel}</AppText>
          <Icon name="edit" size={17} color={colors.pine} />
        </Pressable>
      </View>

      {!draft.query ? <View style={{ gap: 12, paddingBottom: 22 }}>
        <SectionTitle>Places to visit</SectionTitle>
        <PlacesRow delay={260} />
      </View> : null}

      {deals.length >= 2 ? <View style={{ gap: 4, paddingBottom: 18 }}>
        <SectionTitle>Best deals in Vagamon</SectionTitle>
        <Reveal delay={320} duration={520} from="right"><DealCarousel stays={deals} /></Reveal>
      </View> : null}

      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Heading size={19}>{results.length} {results.length === 1 ? 'stay' : 'stays'} in Vagamon</Heading>
        {sort !== 'recommended' ? <AppText style={{ color: colors.fern, fontSize: 12 }}>{sortLabel}</AppText> : null}
      </View>
      {error ? <AppText style={{ fontSize: 12, color: colors.error, marginHorizontal: 16, marginBottom: 10 }}>{error}</AppText> : null}
      {!valid ? <Pressable accessibilityRole="button" accessibilityLabel="Update travel dates" onPress={editSearch} style={{ backgroundColor: colors.softError, padding: 12, borderRadius: 10, marginHorizontal: 16, marginBottom: 12 }}><AppText style={{ fontSize: 12, color: colors.error }}>Update your dates to continue booking.</AppText></Pressable> : null}
      {results.length ? results.map((stay) => <StayCard key={stay.id} stay={stay} />)
        : <View style={{ paddingHorizontal: 20 }}><EmptyState title="No stays found" body="Try another stay name or place in Vagamon." action="Clear search" onAction={() => updateDraft({ query: '' })} /></View>}

      <View style={{ marginTop: 24 }}><WhyVagaGo stays={stays} /></View>
      <View style={{ marginTop: 36 }}><Faq /></View>
    </ScrollView>

    <SortSheet visible={sorting} value={sort} onChange={setSort} onClose={() => setSorting(false)} />
  </Animated.View></Reveal></LeaveListContext>;
}
