import { useState, type ReactNode } from 'react';
import { Keyboard, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateGetawayDraft } from '@vagago/domain';
import { AppText, EmptyState, Heading, StayCard } from '@/components/ui';
import { Faq, PlacesRow, SectionTitle, WhyVagaGo } from '@/components/explore-sections';
import { Reveal } from '@/components/motion';
import { Icon, type IconName } from '@/components/icon';
import { SortSheet } from '@/components/sort-sheet';
import { matchStays, sortOptions, sortStays, type SortId } from '@/data/search';
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
  const valid = validateGetawayDraft(draft).valid;
  const editSearch = () => router.push('/search');
  const dates = `${shortDate(draft.checkIn)} – ${shortDate(draft.checkOut)}`;
  const guestsLabel = `${draft.guests} ${draft.guests === 1 ? 'guest' : 'guests'}`;
  const sortLabel = sortOptions.find((option) => option.id === sort)!.label;

  return <View style={{ flex: 1, backgroundColor: colors.white }}>
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.stone, gap: 12 }}>
      <Reveal><View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.stone }}>
        <Icon name="search" size={20} color={colors.ink} />
        <TextInput accessibilityLabel="Search stays or places in Vagamon" placeholder="Search stays or places in Vagamon" placeholderTextColor={colors.fern}
          value={draft.query} onChangeText={(query) => updateDraft({ query })} maxLength={120} returnKeyType="search"
          autoCapitalize="none" autoCorrect={false} clearButtonMode="never" onSubmitEditing={Keyboard.dismiss}
          style={{ flex: 1, minHeight: 48, fontFamily: fonts.medium, fontSize: 15, color: colors.ink }} />
        {draft.query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => updateDraft({ query: '' })}
          style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={13} color={colors.ink} /></Pressable> : null}
      </View></Reveal>
      <Reveal delay={70}><ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <HeaderChip icon="sort" label={sort === 'recommended' ? 'Sort' : sortLabel} accessibilityLabel={`Sort stays, currently ${sortLabel}`} active={sort !== 'recommended'} onPress={() => { Keyboard.dismiss(); setSorting(true); }} />
        <HeaderChip icon="calendar" label={dates} accessibilityLabel={`Dates ${dates}, edit`} onPress={editSearch} />
        <HeaderChip icon="users" label={guestsLabel} accessibilityLabel={`${guestsLabel}, edit`} onPress={editSearch} />
      </ScrollView></Reveal>
    </View>

    <ScrollView contentInsetAdjustmentBehavior="never" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.fern} />}>
      <Reveal delay={140} style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, gap: 4 }}>
        <Heading size={23}>Affordable stays at the best price</Heading>
        <Pressable accessibilityRole="button" accessibilityLabel={`Vagamon, ${dates}, ${guestsLabel}. Edit search`} onPress={editSearch}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 32, opacity: pressed ? 0.6 : 1 })}>
          <AppText style={{ color: colors.fern, fontSize: 14 }}>Vagamon · {dates} · {guestsLabel}</AppText>
          <Icon name="edit" size={17} color={colors.pine} />
        </Pressable>
      </Reveal>

      {!draft.query ? <View style={{ gap: 12, paddingBottom: 22 }}>
        <Reveal delay={210}><SectionTitle>Places to visit</SectionTitle></Reveal>
        <PlacesRow delay={260} />
      </View> : null}


      <Reveal delay={560} style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Heading size={19}>{results.length} {results.length === 1 ? 'stay' : 'stays'} in Vagamon</Heading>
        {sort !== 'recommended' ? <AppText style={{ color: colors.fern, fontSize: 12 }}>{sortLabel}</AppText> : null}
      </Reveal>
      {error ? <AppText style={{ fontSize: 12, color: colors.error, marginHorizontal: 16, marginBottom: 10 }}>{error}</AppText> : null}
      {!valid ? <Pressable accessibilityRole="button" accessibilityLabel="Update travel dates" onPress={editSearch} style={{ backgroundColor: colors.softError, padding: 12, borderRadius: 10, marginHorizontal: 16, marginBottom: 12 }}><AppText style={{ fontSize: 12, color: colors.error }}>Update your dates to continue booking.</AppText></Pressable> : null}
      {results.length ? results.map((stay, index) => <Reveal key={stay.id} delay={600 + Math.min(index, 4) * 80}><StayCard stay={stay} /></Reveal>)
        : <View style={{ paddingHorizontal: 20 }}><EmptyState title="No stays found" body="Try another stay name or place in Vagamon." action="Clear search" onAction={() => updateDraft({ query: '' })} /></View>}

      <View style={{ marginTop: 24 }}><WhyVagaGo stays={stays} /></View>
      <View style={{ marginTop: 36 }}><Faq /></View>
    </ScrollView>

    <SortSheet visible={sorting} value={sort} onChange={setSort} onClose={() => setSorting(false)} />
  </View>;
}
