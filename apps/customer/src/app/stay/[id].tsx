import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { matchPreviewStays, parseDateOnly, validateGetawayDraft } from '@vagago/domain';
import { AppText, Button, EmptyState, Heading, Page } from '@/components/ui';
import { Icon } from '@/components/icon';
import { StayGallery } from '@/components/stay-gallery';
import { HiddenLocation } from '@/components/hidden-location';
import { NearbyPlaces } from '@/components/nearby-places';
import { PriceDisplay } from '@/components/price-display';
import { money, stays } from '@/data/stays';
import { getRoomOptions, type RoomOption } from '@/data/room-options';
import { useEscape } from '@/state/escape-context';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

function displayDate(value: string) {
  const date = parseDateOnly(value);
  return date ? new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(new Date(date.epochDay * 86_400_000)) : 'Choose date';
}

function AccommodationOption({ option, selected, guests, onSelect }: {
  option: RoomOption;
  selected: boolean;
  guests: number;
  onSelect: () => void;
}) {
  const suitable = guests <= option.capacity;
  return <Pressable onPress={onSelect} accessibilityRole="radio" accessibilityState={{ checked: selected }}
    accessibilityLabel={`${option.name}, ${option.beds}, up to ${option.capacity} guests, ${money(option.nightlyRate)} per night${suitable ? '' : ', too small for your group'}`}
    style={({ pressed }) => ({ borderWidth: selected ? 1.5 : 1, borderColor: selected ? colors.pine : colors.stone, borderRadius: 14, borderCurve: 'continuous', padding: 16, gap: 12, backgroundColor: selected ? colors.meadow : colors.white, opacity: pressed ? 0.8 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <AppText style={{ fontFamily: fonts.bold, fontSize: 16 }}>{option.name}</AppText>
      <View style={{ width: 23, height: 23, borderRadius: 12, borderWidth: selected ? 7 : 1.5, borderColor: selected ? colors.pine : colors.fern, backgroundColor: colors.white }} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="home" size={16} /><AppText style={{ fontSize: 12 }}>{option.beds}</AppText></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="users" size={16} /><AppText style={{ fontSize: 12 }}>Up to {option.capacity} guests</AppText></View>
    </View>
    <AppText style={{ fontSize: 12, lineHeight: 19, color: colors.fern }}>{option.description}</AppText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {option.features.map((feature) => <View key={feature} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name="check" size={13} /><AppText style={{ fontSize: 11, color: colors.fern }}>{feature}</AppText></View>)}
    </View>
    <View style={{ borderTopWidth: 1, borderColor: colors.stone, paddingTop: 10, gap: 3 }}>
      <PriceDisplay rate={option.nightlyRate} compareAtRate={option.compareAtRate} size={18} />
      <AppText style={{ fontSize: 11, lineHeight: 18, color: suitable ? colors.fern : colors.error }}>{suitable ? 'Estimated price · 1 entire property' : `Fits up to ${option.capacity} guests. Edit your guest count to continue.`}</AppText>
    </View>
  </Pressable>;
}

function StayDetailContent({ stay }: { stay: Stay }) {
  const { draft, updateDraft } = useEscape();
  const insets = useSafeAreaInsets();
  const options = getRoomOptions(stay);
  const [selectedId, setSelectedId] = useState(() => options.find((option) => option.id === draft.roomOptionId)?.id ?? options[0].id);
  const selected = options.find((option) => option.id === selectedId) ?? options[0];
  const validation = validateGetawayDraft(draft);
  const suitable = draft.guests <= selected.capacity;
  const matchesSearch = matchPreviewStays([stay], draft).length > 0;
  const error = !validation.valid ? Object.values(validation.errors)[0]
    : !suitable ? `This ${stay.stayStyle} fits up to ${selected.capacity} guests. Edit your guest count.`
    : !matchesSearch ? 'This stay does not match your current search. Edit dates and guests or adjust your filters.' : null;
  const editSearch = () => router.push('/search');
  const bookStay = () => {
    if (error) return;
    updateDraft({ stayId: stay.id, roomOptionId: selected.id, roomCount: 1 });
    router.push('/review');
  };

  return <View style={{ flex: 1, backgroundColor: colors.white }}>
    <Stack.Screen options={{ title: 'Property details', headerLeft: () => <Pressable accessibilityRole="button" accessibilityLabel="Back to stays" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}><Icon name="back" size={22} /></Pressable> }} />
    <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 24 }}>
      <StayGallery stay={stay} />
      <View style={{ paddingHorizontal: 20, gap: 24, paddingTop: 20 }}>
        <View style={{ gap: 8 }}>
          <Heading size={25} style={{ fontFamily: fonts.bold, lineHeight: 32, color: colors.ink }}>{stay.name}</Heading>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name="pin" size={15} /><AppText style={{ color: colors.fern, fontSize: 12 }}>{stay.area}, Vagamon, Kerala</AppText></View>
          <AppText style={{ fontSize: 13, color: colors.fern }}>{stay.bedrooms} {stay.bedrooms === 1 ? 'bedroom' : 'bedrooms'} · Up to {stay.capacity} guests · Entire {stay.stayStyle}</AppText>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Edit dates and guests" onPress={editSearch}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: colors.stone, borderRadius: 12, opacity: pressed ? 0.7 : 1 })}>
          <Icon name="calendar" size={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{displayDate(draft.checkIn)} – {displayDate(draft.checkOut)}</AppText>
            <AppText style={{ color: colors.fern, fontSize: 12 }}>{draft.guests} {draft.guests === 1 ? 'guest' : 'guests'}{validation.nights ? ` · ${validation.nights} ${validation.nights === 1 ? 'night' : 'nights'}` : ''}</AppText>
          </View>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, textDecorationLine: 'underline' }}>Edit</AppText>
        </Pressable>

        <View style={{ gap: 14 }}>
          <Heading size={19}>What this place offers</Heading>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {stay.amenities.map((amenity) => <View key={amenity} style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Icon name="check" size={18} /><AppText style={{ fontSize: 13, flexShrink: 1 }}>{amenity}</AppText>
            </View>)}
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderColor: colors.stone, paddingTop: 22, gap: 12 }}>
          <View style={{ gap: 4 }}><Heading size={19}>Choose your stay</Heading><AppText style={{ color: colors.fern, fontSize: 12 }}>The whole property is yours</AppText></View>
          {options.map((option) => <AccommodationOption key={option.id} option={option} selected={selected.id === option.id} guests={draft.guests} onSelect={() => setSelectedId(option.id)} />)}
        </View>

        <HiddenLocation area={stay.area} />

        <NearbyPlaces stay={stay} />
      </View>
    </ScrollView>
    <View style={{ borderTopWidth: 1, borderColor: colors.stone, backgroundColor: colors.white, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), gap: 9 }}>
      {error ? <View style={{ gap: 3 }}>
        <AppText selectable style={{ color: colors.error, fontSize: 12, lineHeight: 18 }}>{error}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit search" onPress={editSearch} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, textDecorationLine: 'underline' }}>Edit search</AppText>
        </Pressable>
      </View> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <PriceDisplay rate={selected.nightlyRate} compareAtRate={selected.compareAtRate} size={20} showDiscount={false} />
          <AppText style={{ fontSize: 10, lineHeight: 17, color: colors.fern }}>Taxes & fees extra</AppText>
        </View>
        <Button label="Book now" onPress={bookStay} disabled={Boolean(error)} icon={null} style={{ minHeight: 50, borderRadius: 11, paddingHorizontal: 21 }} />
      </View>
    </View>
  </View>;
}

export default function StayDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stay = stays.find((item) => item.id === id);
  if (!stay) return <Page><Stack.Screen options={{ title: 'Property details' }} /><EmptyState title="Stay not found" body="This property is no longer listed." action="Explore stays" onAction={() => router.replace('/')} icon="search" /></Page>;
  return <StayDetailContent key={stay.id} stay={stay} />;
}
