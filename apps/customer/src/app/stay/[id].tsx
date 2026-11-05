import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseDateOnly, validateGetawayDraft } from '@vagago/domain';
import { AppText, Button, Chip, EmptyState, Heading, Page, stayStyleLabel } from '@/components/ui';
import { Icon } from '@/components/icon';
import { StayGallery } from '@/components/stay-gallery';
import { Highlights } from '@/components/highlights';
import { Reveal } from '@/components/motion';
import { HiddenLocation } from '@/components/hidden-location';
import { NearbyPlaces } from '@/components/nearby-places';
import { openArea } from '@/components/directions';
import { DealPrice, PriceDisplay } from '@/components/price-display';
import { matchStays } from '@/data/search';
import { money } from '@/data/stays';
import { useCatalog } from '@/state/catalog-context';
import { getRoomOptions, type RoomOption } from '@/data/room-options';
import { useEscape } from '@/state/escape-context';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

const brandMark = require('../../../assets/splash-mark.png');

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

function RoundButton({ icon, label, onPress }: { icon: 'back' | 'share'; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}
    style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.18)', opacity: pressed ? 0.75 : 1 })}>
    <Icon name={icon} size={19} color={colors.ink} />
  </Pressable>;
}

function StayDetailContent({ stay, initialPhoto }: { stay: Stay; initialPhoto: number }) {
  const { draft, updateDraft } = useEscape();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Once the photo has scrolled away, a solid bar with the name replaces the floating buttons' backdrop.
  const [solidHeader, setSolidHeader] = useState(false);
  const solidAfter = width * 0.92 - 56;
  const options = getRoomOptions(stay);
  const [selectedId, setSelectedId] = useState(() => options.find((option) => option.id === draft.roomOptionId)?.id ?? options[0].id);
  const selected = options.find((option) => option.id === selectedId) ?? options[0];
  const validation = validateGetawayDraft(draft);
  const suitable = draft.guests <= selected.capacity;
  const matchesSearch = matchStays([stay], draft).length > 0;
  const error = !validation.valid ? Object.values(validation.errors)[0]
    : !suitable ? `This ${stay.stayStyle} fits up to ${selected.capacity} guests. Edit your guest count.`
    : !matchesSearch ? 'This stay does not fit your group. Edit your guest count.' : null;
  const editSearch = () => router.push('/search');
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/');
  const share = () => void Share.share({ message: `${stay.name}, ${stay.area}, Vagamon. From ${money(stay.nightlyRate)} a night on VagaGo.` }).catch(() => undefined);
  const bookStay = () => {
    if (error) return;
    updateDraft({ stayId: stay.id, roomOptionId: selected.id, roomCount: 1 });
    router.push('/review');
  };

  return <View style={{ flex: 1, backgroundColor: colors.white }}>
    <StatusBar style={solidHeader ? 'dark' : 'light'} />
    <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: 28 }} scrollEventThrottle={16}
      onScroll={(event) => { const solid = event.nativeEvent.contentOffset.y > solidAfter; if (solid !== solidHeader) setSolidHeader(solid); }}>
      <StayGallery stay={stay} topInset={insets.top} initialIndex={initialPhoto} />
      <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 24 }}>
        <Reveal style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip icon="home" label={`Entire ${stayStyleLabel(stay).toLowerCase()}`} />
            <Chip icon="cash" label="Pay at stay" tone="save" />
          </View>
          <Heading size={27} style={{ lineHeight: 34, letterSpacing: -0.6 }}>{stay.name}</Heading>
          {stay.tagline ? <AppText style={{ color: colors.fern, fontSize: 14 }}>{stay.tagline}</AppText> : null}
          <View style={{ gap: 6, paddingTop: 14, borderTopWidth: 1, borderColor: colors.stone, marginTop: 4 }}>
            <AppText style={{ fontSize: 15, lineHeight: 23 }}>{stay.area}, Vagamon, Kerala | {stay.bedrooms} {stay.bedrooms === 1 ? 'bedroom' : 'bedrooms'} | Up to {stay.capacity} guests</AppText>
            <Pressable accessibilityRole="link" accessibilityLabel={`View ${stay.area} on the map`} onPress={() => openArea(stay.coordinates, `${stay.area}, Vagamon`)} style={{ alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' }}>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.pine }}>View area on map</AppText>
            </Pressable>
          </View>
        </Reveal>

        <Reveal delay={80}><View style={{ backgroundColor: colors.brand, borderRadius: 16, borderCurve: 'continuous', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, color: colors.white }}>Book now, pay at the stay</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.8)' }}>No advance payment. The exact address and directions unlock as soon as you book.</Text>
          </View>
          <Image source={brandMark} accessible={false} contentFit="contain" style={{ width: 62, height: 47 }} />
        </View></Reveal>

        <Reveal delay={160}><Highlights stay={stay} /></Reveal>

        <Reveal delay={240}><Pressable accessibilityRole="button" accessibilityLabel="Edit dates and guests" onPress={editSearch}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: colors.stone, borderRadius: 12, opacity: pressed ? 0.7 : 1 })}>
          <Icon name="calendar" size={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{displayDate(draft.checkIn)} – {displayDate(draft.checkOut)}</AppText>
            <AppText style={{ color: colors.fern, fontSize: 12 }}>{draft.guests} {draft.guests === 1 ? 'guest' : 'guests'}{validation.nights ? ` · ${validation.nights} ${validation.nights === 1 ? 'night' : 'nights'}` : ''}</AppText>
          </View>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, textDecorationLine: 'underline' }}>Edit</AppText>
        </Pressable></Reveal>

        {stay.description ? <View style={{ gap: 8 }}>
          <Heading size={19}>About this stay</Heading>
          <AppText style={{ fontSize: 14, lineHeight: 22, color: colors.ink }}>{stay.description}</AppText>
        </View> : null}

        {stay.amenities.length ? <View style={{ gap: 14 }}>
          <Heading size={19}>What this place offers</Heading>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {stay.amenities.map((amenity) => <View key={amenity} style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Icon name="check" size={18} color={colors.save} /><AppText style={{ fontSize: 13, flexShrink: 1 }}>{amenity}</AppText>
            </View>)}
          </View>
        </View> : null}

        <View style={{ borderTopWidth: 1, borderColor: colors.stone, paddingTop: 22, gap: 12 }}>
          <View style={{ gap: 4 }}><Heading size={19}>Choose your stay</Heading><AppText style={{ color: colors.fern, fontSize: 12 }}>The whole property is yours</AppText></View>
          {options.map((option) => <AccommodationOption key={option.id} option={option} selected={selected.id === option.id} guests={draft.guests} onSelect={() => setSelectedId(option.id)} />)}
        </View>

        <HiddenLocation area={stay.area} />

        <NearbyPlaces stay={stay} />
      </View>
    </ScrollView>

    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: solidHeader ? colors.white : 'transparent', borderBottomWidth: 1, borderColor: solidHeader ? colors.stone : 'transparent' }}>
      <RoundButton icon="back" label="Back to stays" onPress={goBack} />
      <Text numberOfLines={1} accessibilityElementsHidden={!solidHeader} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, opacity: solidHeader ? 1 : 0 }}>{stay.name}</Text>
      <RoundButton icon="share" label={`Share ${stay.name}`} onPress={share} />
    </View>

    <View style={{ backgroundColor: colors.white, paddingHorizontal: 18, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), gap: 8, boxShadow: '0 -2px 12px rgba(0,0,0,0.08)' }}>
      {error ? <View style={{ gap: 3 }}>
        <AppText selectable style={{ color: colors.error, fontSize: 12, lineHeight: 18 }}>{error}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit search" onPress={editSearch} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, textDecorationLine: 'underline' }}>Edit dates and guests</AppText>
        </Pressable>
      </View> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 1 }}>
          <DealPrice rate={selected.nightlyRate} compareAtRate={selected.compareAtRate} size={24} showDiscount={false} />
          <AppText style={{ fontSize: 13, lineHeight: 18, color: colors.pine, fontFamily: fonts.medium }}>+ taxes & fees</AppText>
        </View>
        <Button label="Book now & pay at stay" onPress={bookStay} disabled={Boolean(error)} icon={null} style={{ minHeight: 52, borderRadius: 12, paddingHorizontal: 18 }} />
      </View>
    </View>
  </View>;
}

export default function StayDetails() {
  const { id, photo } = useLocalSearchParams<{ id: string; photo?: string }>();
  const { stays, ready } = useCatalog();
  const stay = stays.find((item) => item.id === id);
  if (!stay && !ready) return <Page><Stack.Screen options={{ headerShown: true, title: 'Property details' }} /></Page>;
  if (!stay) return <Page><Stack.Screen options={{ headerShown: true, title: 'Property details' }} /><EmptyState title="Stay not found" body="This property is no longer listed." action="Explore stays" onAction={() => router.replace('/')} icon="search" /></Page>;
  return <StayDetailContent key={stay.id} stay={stay} initialPhoto={Number(photo) || 0} />;
}
