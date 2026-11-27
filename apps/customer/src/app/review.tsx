import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { estimateStaySubtotal, validateGetawayDraft } from '@vagago/domain';
import { AppText, Button, EmptyState, Heading, Page } from '@/components/ui';
import { formatDate } from '@/components/escape-summary';
import { Icon } from '@/components/icon';
import { BookingFeeCard } from '@/components/booking-moments';
import { ease } from '@/components/motion';
import { useEscape, validateBookingGuest } from '@/state/escape-context';
import { useBookings } from '@/state/bookings-context';
import { useAccount } from '@/state/account-context';
import { availableOffers, bookingFee, discountFor, type Offer } from '@/data/offers';
import { money } from '@/data/stays';
import { useStays } from '@/state/catalog-context';
import { getRoomOptions } from '@/data/room-options';
import { colors, fonts } from '@/theme';

const input = { minHeight: 52, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 } as const;

// The whole booking on one screen: stay, guest, offers, price and confirm. No separate payment step.
export default function Review() {
  const { draft, bookingGuest, updateBookingGuest, updateDraft } = useEscape();
  const { createBooking, bookings } = useBookings();
  const { account } = useAccount();
  const offers = availableOffers(bookings);
  // The best offer the guest qualifies for is applied by default; tapping it again removes it.
  const [offerCode, setOfferCode] = useState<string | null>(offers[0]?.code ?? null);
  const stays = useStays();
  const insets = useSafeAreaInsets();
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const nameInput = useRef<TextInput>(null);
  const mobileInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);

  // Fill the guest from the logged-in account so most bookings need no typing at all.
  useEffect(() => {
    if (account && !bookingGuest.fullName && !bookingGuest.mobile) updateBookingGuest({ fullName: account.name, mobile: account.mobile });
  }, [account, bookingGuest.fullName, bookingGuest.mobile, updateBookingGuest]);
  const errors = validateBookingGuest(bookingGuest);
  const guestReady = Object.keys(errors).length === 0;
  // Logged-in guests see a one-line summary with Change; typing always keeps the form open.
  const [editingGuest, setEditingGuest] = useState(!account);
  const showGuestForm = editingGuest || !guestReady;
  const editGuest = (patch: Parameters<typeof updateBookingGuest>[0]) => { setEditingGuest(true); updateBookingGuest(patch); };

  const stay = stays.find((item) => item.id === draft.stayId);
  const room = stay ? getRoomOptions(stay).find((option) => option.id === draft.roomOptionId) : undefined;
  const valid = validateGetawayDraft(draft).valid;
  const estimate = room ? estimateStaySubtotal(room.nightlyRate, draft.checkIn, draft.checkOut) : null;
  const offer: Offer | null = offers.find((item) => item.code === offerCode) ?? null;
  const discount = estimate ? discountFor(estimate.subtotal, offer) : 0;
  const total = estimate ? estimate.subtotal - discount + bookingFee : 0;
  const editDates = () => router.push({ pathname: '/search', params: { returnTo: 'review' } });

  if (!stay) return <Page><Stack.Screen options={{ title: 'Booking details' }} /><EmptyState title="Choose a stay first" body="Find your accommodation in Vagamon to start your booking." action="Find a stay" onAction={() => router.replace('/')} icon="search" /></Page>;
  if (!valid) return <Page><Stack.Screen options={{ title: 'Booking details' }} /><EmptyState title="Check your booking details" body="Choose valid travel dates and guests to continue with your booking." action="Edit dates and guests" onAction={editDates} icon="calendar" /></Page>;
  if (!room || !estimate || draft.roomCount !== 1 || room.capacity < draft.guests) return <Page><Stack.Screen options={{ title: 'Booking details' }} /><EmptyState title="Choose your accommodation" body="Select accommodation with enough space for everyone." action="View accommodation" onAction={() => router.replace(`/stay/${stay.id}`)} icon="bed" /></Page>;

  const confirmBooking = async () => {
    if (confirming) return;
    setSubmitted(true);
    if (!guestReady) {
      setEditingGuest(true);
      if (errors.fullName) nameInput.current?.focus();
      else if (errors.mobile) mobileInput.current?.focus();
      else emailInput.current?.focus();
      return;
    }
    Keyboard.dismiss();
    const guest = { fullName: bookingGuest.fullName.trim(), mobile: bookingGuest.mobile.replace(/[\s-]/g, ''), email: bookingGuest.email.trim() };
    updateBookingGuest(guest);
    setConfirming(true);
    setBookingError(null);
    try {
      const booking = await createBooking({ roomOptionId: room.id, checkIn: draft.checkIn, checkOut: draft.checkOut, guests: draft.guests, guest, offerCode: offer?.code ?? null });
      updateDraft({ stayId: null, roomOptionId: null });
      router.dismissAll();
      router.push({ pathname: '/booking/[id]', params: { id: booking.id, confirmed: '1' } });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Couldn’t confirm your booking. Please try again.');
      setConfirming(false);
    }
  };

  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1, backgroundColor: colors.white }}>
    <Stack.Screen options={{ title: 'Booking details' }} />
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 26, gap: 24 }}>
      <View style={{ borderWidth: 1, borderColor: colors.stone, borderRadius: 16, padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
          <Image source={stay.thumbnail} cachePolicy="memory-disk" style={{ width: 84, height: 90, borderRadius: 11 }} contentFit="cover" accessibilityLabel={`${stay.name} photo`} />
          <View style={{ flex: 1, gap: 4 }}><AppText style={{ fontSize: 10, color: colors.fern }}>{stay.area}, Vagamon</AppText><Heading size={17}>{stay.name}</Heading><AppText style={{ fontSize: 12, color: colors.fern }}>{room.name} · {room.beds}</AppText></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: colors.stone, paddingTop: 12 }}>
          <View style={{ flex: 1, gap: 3 }}><AppText style={{ fontSize: 11, color: colors.fern }}>Check-in</AppText><AppText selectable style={{ fontSize: 13, fontFamily: fonts.semibold }}>{formatDate(draft.checkIn)}</AppText></View>
          <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: colors.stone }} />
          <View style={{ flex: 1, gap: 3 }}><AppText style={{ fontSize: 11, color: colors.fern }}>Check-out</AppText><AppText selectable style={{ fontSize: 13, fontFamily: fonts.semibold }}>{formatDate(draft.checkOut)}</AppText></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit booking dates and guests" onPress={editDates} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}><AppText style={{ fontFamily: fonts.bold, color: colors.pine, fontSize: 12, textDecorationLine: 'underline' }}>Edit</AppText></Pressable>
        </View>
        <AppText selectable style={{ fontSize: 12, color: colors.fern }}>{estimate.nights} {estimate.nights === 1 ? 'night' : 'nights'} · {draft.guests} {draft.guests === 1 ? 'guest' : 'guests'} · Exact address after you book</AppText>
      </View>

      <Animated.View layout={LinearTransition.duration(260).easing(ease)} style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Heading size={18}>Guest</Heading>
          {!showGuestForm ? <Pressable accessibilityRole="button" accessibilityLabel="Change guest details" onPress={() => setEditingGuest(true)} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}><AppText style={{ fontFamily: fonts.bold, color: colors.pine, fontSize: 12, textDecorationLine: 'underline' }}>Change</AppText></Pressable> : null}
        </View>
        {!showGuestForm ? <Animated.View entering={FadeIn.duration(220)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: colors.canvas }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.meadow, alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={19} /></View>
          <View style={{ flex: 1, gap: 2 }}><AppText style={{ fontFamily: fonts.bold, fontSize: 14 }}>{bookingGuest.fullName.trim()}</AppText><AppText style={{ fontSize: 12, color: colors.fern }}>+91 {bookingGuest.mobile.replace(/[\s-]/g, '')}{bookingGuest.email.trim() ? ` · ${bookingGuest.email.trim()}` : ''}</AppText></View>
        </Animated.View> : <Animated.View entering={FadeIn.duration(220)} style={{ gap: 14 }}>
          <View style={{ gap: 6 }}><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>Full name</AppText><TextInput ref={nameInput} accessibilityLabel="Guest full name" placeholder="Name as on your ID" placeholderTextColor={colors.fern} value={bookingGuest.fullName} onChangeText={(fullName) => editGuest({ fullName })} autoComplete="name" autoCapitalize="words" maxLength={100} returnKeyType="next" onSubmitEditing={() => mobileInput.current?.focus()} style={[input, { borderColor: submitted && errors.fullName ? colors.error : colors.stone }]} />{submitted && errors.fullName ? <AppText selectable style={{ fontSize: 11, color: colors.error }}>{errors.fullName}</AppText> : null}</View>
          <View style={{ gap: 6 }}><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>Mobile number</AppText><View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: submitted && errors.mobile ? colors.error : colors.stone, borderRadius: 11, paddingHorizontal: 14 }}><AppText style={{ fontSize: 13, paddingRight: 11 }}>+91</AppText><View style={{ width: 1, height: 20, backgroundColor: colors.stone }} /><TextInput ref={mobileInput} accessibilityLabel="Guest mobile number, India country code plus 91" placeholder="10-digit mobile number" placeholderTextColor={colors.fern} value={bookingGuest.mobile} onChangeText={(mobile) => editGuest({ mobile })} keyboardType="phone-pad" autoComplete="tel-national" maxLength={14} returnKeyType="next" onSubmitEditing={() => emailInput.current?.focus()} style={{ flex: 1, minHeight: 52, paddingLeft: 12, paddingVertical: 13, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 }} /></View>{submitted && errors.mobile ? <AppText selectable style={{ fontSize: 11, color: colors.error }}>{errors.mobile}</AppText> : null}</View>
          <View style={{ gap: 6 }}><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>Email <AppText style={{ fontSize: 12, color: colors.fern }}>(optional)</AppText></AppText><TextInput ref={emailInput} accessibilityLabel="Guest email address, optional" placeholder="you@example.com" placeholderTextColor={colors.fern} value={bookingGuest.email} onChangeText={(email) => editGuest({ email })} keyboardType="email-address" autoComplete="email" autoCapitalize="none" autoCorrect={false} maxLength={254} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={[input, { borderColor: submitted && errors.email ? colors.error : colors.stone }]} />{submitted && errors.email ? <AppText selectable style={{ fontSize: 11, color: colors.error }}>{errors.email}</AppText> : null}</View>
        </Animated.View>}
      </Animated.View>

      {offers.length ? <View style={{ gap: 12, paddingTop: 22, borderTopWidth: 1, borderColor: colors.stone }}>
        <View style={{ gap: 4 }}><Heading size={18}>Offers for you</Heading><AppText style={{ color: colors.fern, fontSize: 12 }}>The best offer is already applied. One offer per booking.</AppText></View>
        {offers.map((item) => {
          const selected = item.code === offerCode;
          return <Pressable key={item.code} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${item.title}, ${item.percent}% off, saves ${money(discountFor(estimate.subtotal, item))}`}
            onPress={() => setOfferCode(selected ? null : item.code)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: selected ? 1.5 : 1, borderColor: selected ? colors.gold : colors.stone, backgroundColor: selected ? colors.softSave : colors.white, opacity: pressed ? 0.8 : 1 })}>
            <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: item.kind === 'welcome' ? colors.brand : '#C88A2A', alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.white }}>{item.percent}%</AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText style={{ fontFamily: fonts.bold, fontSize: 14 }}>{item.title}</AppText>
              <AppText style={{ fontSize: 12, color: colors.save, fontFamily: fonts.semibold }}>Save {money(discountFor(estimate.subtotal, item))} · {item.code}</AppText>
            </View>
            <View style={{ width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: selected ? colors.save : colors.fern, alignItems: 'center', justifyContent: 'center' }}>{selected ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.save }} /> : null}</View>
          </Pressable>;
        })}
      </View> : null}

      <BookingFeeCard />

      <View style={{ gap: 13, paddingTop: 22, borderTopWidth: 1, borderColor: colors.stone }}>
        <Heading size={18}>Price details</Heading>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 13 }}>{money(room.nightlyRate)} × {estimate.nights} {estimate.nights === 1 ? 'night' : 'nights'}</AppText><AppText selectable style={{ fontSize: 13 }}>{money(estimate.subtotal)}</AppText></View>
        {offer ? <Animated.View key={offer.code} entering={FadeIn.duration(260)} exiting={FadeOut.duration(160)} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 13, color: colors.save }}>{offer.title}</AppText><AppText selectable style={{ fontSize: 13, color: colors.save, fontFamily: fonts.semibold }}>− {money(discount)}</AppText></Animated.View> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 13 }}>Booking fee <AppText style={{ fontSize: 12, color: colors.action, fontFamily: fonts.semibold }}>flat</AppText></AppText><AppText selectable style={{ fontSize: 13 }}>{money(bookingFee)}</AppText></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: colors.stone, paddingTop: 12 }}><AppText style={{ fontSize: 14, fontFamily: fonts.bold }}>Total</AppText><AppText selectable style={{ fontSize: 15, fontFamily: fonts.bold }}>{money(total)}</AppText></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.action }}>Pay now (booking fee)</AppText><AppText selectable style={{ fontSize: 13, fontFamily: fonts.bold, color: colors.action }}>{money(bookingFee)}</AppText></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 13, fontFamily: fonts.semibold, color: colors.save }}>Pay at the stay <AppText style={{ fontSize: 12, fontFamily: fonts.regular, color: colors.fern }}>UPI, card or cash</AppText></AppText><AppText selectable style={{ fontSize: 13, fontFamily: fonts.bold, color: colors.save }}>{money(total - bookingFee)}</AppText></View>
        <AppText style={{ fontSize: 11, lineHeight: 18, color: colors.fern }}>Taxes and fees, if any, are added by the property at check-in.</AppText>
      </View>
    </ScrollView>

    <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16), borderTopWidth: 1, borderColor: colors.stone, gap: 10 }}>
      <Animated.View layout={LinearTransition.duration(260).easing(ease)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Left: the complete amount for the stay. Right: what the guest pays now, the flat booking fee. */}
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={{ fontSize: 12, color: colors.fern }}>Total amount</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <Animated.Text key={total} entering={FadeIn.duration(260)} selectable style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.ink }}>{money(total)}</Animated.Text>
            {discount ? <AppText style={{ fontSize: 12, fontFamily: fonts.medium, color: colors.save, textDecorationLine: 'line-through' }}>{money(estimate.subtotal + bookingFee)}</AppText> : null}
          </View>
          <AppText style={{ fontSize: 11, lineHeight: 16, color: colors.save, fontFamily: fonts.semibold }}>{discount ? `You save ${money(discount)} · ` : ''}{money(total - bookingFee)} at the stay</AppText>
        </View>
        <View accessible accessibilityLabel={`Pay now ${money(bookingFee)}`} style={{ flexShrink: 0, alignItems: 'flex-end', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.softAction, borderWidth: 1, borderColor: '#F6CDD3' }}>
          <AppText style={{ fontSize: 11, lineHeight: 15, fontFamily: fonts.semibold, color: colors.action }}>Pay now</AppText>
          <AppText numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 24, lineHeight: 31, color: colors.action, fontVariant: ['tabular-nums'] }}>{money(bookingFee)}</AppText>
        </View>
      </Animated.View>
      {bookingError ? <AppText selectable style={{ color: colors.error, fontSize: 12, lineHeight: 18 }}>{bookingError}</AppText> : null}
      <Button label={confirming ? 'Confirming…' : 'Confirm booking'} tone="book" icon={confirming ? null : 'check'} disabled={confirming} onPress={() => void confirmBooking()} />
    </View>
  </KeyboardAvoidingView>;
}
