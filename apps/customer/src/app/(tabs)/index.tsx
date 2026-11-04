import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { matchPreviewStays, validateGetawayDraft } from '@vagago/domain';
import { AppText, EmptyState, StayCard } from '@/components/ui';
import { Icon, type IconName } from '@/components/icon';
import { stays } from '@/data/stays';
import { useEscape } from '@/state/escape-context';
import { colors, fonts } from '@/theme';
import type { StayStyle } from '@/types';

const categories: { id: StayStyle; label: string; icon: IconName }[] = [
  { id: 'all', label: 'All stays', icon: 'bed' },
  { id: 'homestay', label: 'Homestays', icon: 'home' },
  { id: 'cottage', label: 'Cottages', icon: 'leaf' },
  { id: 'villa', label: 'Villas', icon: 'sun' },
];
const sortOptions = [
  { id: 'recommended', label: 'Default order' },
  { id: 'low', label: 'Price: low to high' },
  { id: 'high', label: 'Price: high to low' },
] as const;
function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? 'Add dates' : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}

export default function Explore() {
  const { draft, updateDraft } = useEscape();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<(typeof sortOptions)[number]['id']>('recommended');
  const [sorting, setSorting] = useState(false);
  const matches = matchPreviewStays(stays, draft);
  const results = sort === 'recommended' ? matches : [...matches].sort((a, b) => sort === 'low' ? a.nightlyRate - b.nightlyRate : b.nightlyRate - a.nightlyRate);
  const valid = validateGetawayDraft(draft).valid;
  const editSearch = () => router.push('/search');

  const guestsLabel = `${draft.guests} ${draft.guests === 1 ? 'guest' : 'guests'}`;

  return <View style={{ flex: 1, backgroundColor: colors.white }}>
    <View style={{ paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.stone }}>
      <View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 26, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.stone }}>
        <Icon name="search" size={20} color={colors.ink} />
        <TextInput accessibilityLabel="Search stays or places in Vagamon" placeholder="Search stays, pine forest, meadows…" placeholderTextColor={colors.fern}
          value={draft.query} onChangeText={(query) => updateDraft({ query })} maxLength={120} returnKeyType="search"
          autoCapitalize="none" autoCorrect={false} clearButtonMode="never" onSubmitEditing={Keyboard.dismiss}
          style={{ flex: 1, minHeight: 50, fontFamily: fonts.medium, fontSize: 15, color: colors.ink }} />
        {draft.query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => updateDraft({ query: '' })}
          style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={13} color={colors.ink} /></Pressable> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Dates ${shortDate(draft.checkIn)} to ${shortDate(draft.checkOut)}, edit`} onPress={editSearch}
          style={({ pressed }) => ({ flex: 1.4, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: colors.stone, opacity: pressed ? 0.6 : 1 })}>
          <Icon name="calendar" size={16} color={colors.ink} /><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>{shortDate(draft.checkIn)} – {shortDate(draft.checkOut)}</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${guestsLabel}, edit`} onPress={editSearch}
          style={({ pressed }) => ({ flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: colors.stone, opacity: pressed ? 0.6 : 1 })}>
          <Icon name="users" size={16} color={colors.ink} /><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>{guestsLabel}</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="More filters" onPress={editSearch}
          style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.stone, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Icon name="sliders" size={17} color={colors.ink} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 14, paddingHorizontal: 16, gap: 12 }}>
        {categories.map((category) => {
          const selected = category.id === draft.stayStyle;
          return <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={category.label} accessibilityState={{ selected }} aria-selected={selected} onPress={() => updateDraft({ stayStyle: category.id, mood: null, stayId: null, roomOptionId: null })} style={{ flex: 1, alignItems: 'center', paddingBottom: 10, gap: 6, borderBottomWidth: 2, borderBottomColor: selected ? colors.ink : 'transparent' }}>
            <Icon name={category.icon} size={22} color={selected ? colors.ink : colors.fern} />
            <AppText style={{ fontSize: 11, lineHeight: 17, fontFamily: selected ? fonts.bold : fonts.medium, color: selected ? colors.ink : colors.fern }}>{category.label}</AppText>
          </Pressable>;
        })}
      </View>
    </View>
    <ScrollView contentInsetAdjustmentBehavior="never" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingVertical: 4 }}>
        <AppText style={{ color: colors.fern, fontSize: 12 }}>{results.length} {results.length === 1 ? 'stay' : 'stays'} in Vagamon</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Sort stays" accessibilityState={{ expanded: sorting }} onPress={() => setSorting(!sorting)} style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name="sort" size={14} color={colors.ink} /><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>Sort</AppText></Pressable>
      </View>
      {sorting ? <View style={{ backgroundColor: colors.canvas, borderRadius: 14, padding: 6, marginHorizontal: 16, marginBottom: 10 }}>{sortOptions.map((option) => <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: sort === option.id }} onPress={() => { setSort(option.id); setSorting(false); }} style={{ minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><AppText style={{ fontSize: 13 }}>{option.label}</AppText>{sort === option.id ? <Icon name="check" size={17} /> : null}</Pressable>)}</View> : null}
      {!valid ? <Pressable accessibilityRole="button" accessibilityLabel="Update travel dates" onPress={editSearch} style={{ backgroundColor: colors.softError, padding: 12, borderRadius: 10, marginHorizontal: 16, marginBottom: 10 }}><AppText style={{ fontSize: 12, color: colors.error }}>Update your dates to continue booking.</AppText></Pressable> : null}
      {results.length ? results.map((stay) => <StayCard key={stay.id} stay={stay} />) : <View style={{ paddingHorizontal: 20 }}><EmptyState title="No stays found" body="Try another name or place, or change the property type." action="Clear search" onAction={() => updateDraft({ query: '', stayStyle: 'all' })} /></View>}
    </ScrollView>
  </View>;
}
