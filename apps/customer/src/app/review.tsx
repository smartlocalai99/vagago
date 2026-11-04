import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { estimateStaySubtotal, validateGetawayDraft } from '@vagago/domain';
import { AppText, Button, EmptyState, Heading, Page } from '@/components/ui';
import { formatDate } from '@/components/escape-summary';
import { Icon } from '@/components/icon';
import { useEscape, validateBookingGuest } from '@/state/escape-context';
import { money } from '@/data/stays';
import { useStays } from '@/state/catalog-context';
import { getRoomOptions } from '@/data/room-options';
import { colors, fonts } from '@/theme';

export default function Review() {
  const { draft, bookingGuest, updateBookingGuest } = useEscape();
  const stays = useStays();
  const insets = useSafeAreaInsets();
  const [submitted, setSubmitted] = useState(false);
  const nameInput = useRef<TextInput>(null);
  const mobileInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);
  const stay = stays.find((item) => item.id === draft.stayId);
  const room = stay ? getRoomOptions(stay).find((option) => option.id === draft.roomOptionId) : undefined;
  const valid = validateGetawayDraft(draft).valid;
  const estimate = room ? estimateStaySubtotal(room.nightlyRate, draft.checkIn, draft.checkOut) : null;
  const errors = validateBookingGuest(bookingGuest);
  const editDates = () => router.push({ pathname: '/search', params: { returnTo: 'review' } });
  const continueToPayment = () => {
    setSubmitted(true);
    if (errors.fullName) { nameInput.current?.focus(); return; }
    if (errors.mobile) { mobileInput.current?.focus(); return; }
    if (errors.email) { emailInput.current?.focus(); return; }
    Keyboard.dismiss();
    updateBookingGuest({ fullName: bookingGuest.fullName.trim(), mobile: bookingGuest.mobile.replace(/[\s-]/g, ''), email: bookingGuest.email.trim() });
    router.push('/payment');
  };

  if (!stay) return <Page><Stack.Screen options={{ title: 'Review booking' }} /><EmptyState title="Choose a stay first" body="Find your accommodation in Vagamon to start your booking." action="Find a stay" onAction={() => router.replace('/')} icon="search" /></Page>;
  if (!valid) return <Page><Stack.Screen options={{ title: 'Review booking' }} /><EmptyState title="Check your booking details" body="Choose valid travel dates and guests to continue with your booking." action="Edit dates and guests" onAction={editDates} icon="calendar" /></Page>;
  if (!room || !estimate || draft.roomCount !== 1 || room.capacity < draft.guests) return <Page><Stack.Screen options={{ title: 'Review booking' }} /><EmptyState title="Choose your accommodation" body="Select accommodation with enough space for everyone." action="View accommodation" onAction={() => router.replace(`/stay/${stay.id}`)} icon="bed" /></Page>;

  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1, backgroundColor: colors.white }}>
    <Stack.Screen options={{ title: 'Review booking' }} />
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 26, gap: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.pine, alignItems: 'center', justifyContent: 'center' }}><AppText style={{ fontSize: 11, fontFamily: fonts.bold, color: colors.white }}>1</AppText></View><AppText style={{ fontSize: 12, fontFamily: fonts.bold }}>Booking details</AppText><View style={{ flex: 1, height: 1, backgroundColor: colors.stone }} /><AppText style={{ fontSize: 12, color: colors.fern }}>2 · Payment</AppText></View>
      <View style={{ borderWidth: 1, borderColor: colors.stone, borderRadius: 16, padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
          <Image source={stay.thumbnail} cachePolicy="memory-disk" style={{ width: 84, height: 90, borderRadius: 11 }} contentFit="cover" accessibilityLabel={`${stay.name} photo`} />
          <View style={{ flex: 1, gap: 4 }}><AppText style={{ fontSize: 10, color: colors.fern }}>{stay.area}, Vagamon</AppText><Heading size={17}>{stay.name}</Heading><AppText style={{ fontSize: 12, color: colors.fern }}>{room.name} · {room.beds}</AppText></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center', borderTopWidth: 1, borderColor: colors.stone, paddingTop: 12 }}><Icon name="lock" size={14} /><AppText style={{ flex: 1, fontSize: 11, lineHeight: 17, color: colors.fern }}>Exact address and directions appear after you book</AppText></View>
      </View>
      <View style={{ gap: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><Heading size={18}>Your stay</Heading><Pressable accessibilityRole="button" accessibilityLabel="Edit booking dates and guests" onPress={editDates} style={{ minHeight: 44, justifyContent: 'center' }}><AppText style={{ fontFamily: fonts.bold, color: colors.pine, fontSize: 12, textDecorationLine: 'underline' }}>Edit</AppText></Pressable></View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}><AppText style={{ fontSize: 11, color: colors.fern }}>Check-in</AppText><AppText selectable style={{ fontSize: 13, fontFamily: fonts.semibold }}>{formatDate(draft.checkIn)}</AppText></View>
          <View style={{ width: 1, backgroundColor: colors.stone }} />
          <View style={{ flex: 1, gap: 4 }}><AppText style={{ fontSize: 11, color: colors.fern }}>Check-out</AppText><AppText selectable style={{ fontSize: 13, fontFamily: fonts.semibold }}>{formatDate(draft.checkOut)}</AppText></View>
        </View>
        <AppText selectable style={{ fontSize: 12, color: colors.fern }}>{estimate.nights} {estimate.nights === 1 ? 'night' : 'nights'} · {draft.guests} {draft.guests === 1 ? 'guest' : 'guests'} · 1 {room.name.toLowerCase()}</AppText>
      </View>
      <View style={{ gap: 14, paddingTop: 22, borderTopWidth: 1, borderColor: colors.stone }}>
        <View style={{ gap: 4 }}><Heading size={18}>Guest details</Heading><AppText style={{ color: colors.fern, fontSize: 12 }}>Enter the details of the guest checking in.</AppText></View>
        <View style={{ gap: 6 }}><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>Full name</AppText><TextInput ref={nameInput} accessibilityLabel="Guest full name" placeholder="Name as on your ID" placeholderTextColor={colors.fern} value={bookingGuest.fullName} onChangeText={(fullName) => updateBookingGuest({ fullName })} autoComplete="name" autoCapitalize="words" maxLength={100} returnKeyType="next" onSubmitEditing={() => mobileInput.current?.focus()} style={{ minHeight: 52, borderWidth: 1, borderColor: submitted && errors.fullName ? colors.error : colors.stone, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 }} />{submitted && errors.fullName ? <AppText selectable style={{ fontSize: 11, color: colors.error }}>{errors.fullName}</AppText> : null}</View>
        <View style={{ gap: 6 }}><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>Mobile number</AppText><View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: submitted && errors.mobile ? colors.error : colors.stone, borderRadius: 11, paddingHorizontal: 14 }}><AppText style={{ fontSize: 13, paddingRight: 11 }}>+91</AppText><View style={{ width: 1, height: 20, backgroundColor: colors.stone }} /><TextInput ref={mobileInput} accessibilityLabel="Guest mobile number, India country code plus 91" placeholder="10-digit mobile number" placeholderTextColor={colors.fern} value={bookingGuest.mobile} onChangeText={(mobile) => updateBookingGuest({ mobile })} keyboardType="phone-pad" autoComplete="tel-national" maxLength={14} returnKeyType="next" onSubmitEditing={() => emailInput.current?.focus()} style={{ flex: 1, minHeight: 52, paddingLeft: 12, paddingVertical: 13, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 }} /></View>{submitted && errors.mobile ? <AppText selectable style={{ fontSize: 11, color: colors.error }}>{errors.mobile}</AppText> : null}</View>
        <View style={{ gap: 6 }}><AppText style={{ fontSize: 12, fontFamily: fonts.semibold }}>Email <AppText style={{ fontSize: 12, color: colors.fern }}>(optional)</AppText></AppText><TextInput ref={emailInput} accessibilityLabel="Guest email address, optional" placeholder="you@example.com" placeholderTextColor={colors.fern} value={bookingGuest.email} onChangeText={(email) => updateBookingGuest({ email })} keyboardType="email-address" autoComplete="email" autoCapitalize="none" autoCorrect={false} maxLength={254} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={{ minHeight: 52, borderWidth: 1, borderColor: submitted && errors.email ? colors.error : colors.stone, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: colors.ink, fontFamily: fonts.regular, fontSize: 14 }} />{submitted && errors.email ? <AppText selectable style={{ fontSize: 11, color: colors.error }}>{errors.email}</AppText> : null}</View>
      </View>
      <View style={{ gap: 14, paddingTop: 22, borderTopWidth: 1, borderColor: colors.stone }}>
        <Heading size={18}>Price details</Heading>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 13 }}>{money(room.nightlyRate)} × {estimate.nights} {estimate.nights === 1 ? 'night' : 'nights'}</AppText><AppText selectable style={{ fontSize: 13 }}>{money(estimate.subtotal)}</AppText></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 12, color: colors.fern }}>Taxes and fees</AppText><AppText style={{ fontSize: 12, color: colors.fern }}>Paid at the property</AppText></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: colors.stone, paddingTop: 14 }}><AppText style={{ fontFamily: fonts.bold, fontSize: 13, flex: 1 }}>Estimated subtotal</AppText><AppText selectable style={{ fontFamily: fonts.bold, fontSize: 18 }}>{money(estimate.subtotal)}</AppText></View>
      </View>
    </ScrollView>
    <View style={{ paddingHorizontal: 20, paddingTop: 13, paddingBottom: Math.max(insets.bottom, 16), borderTopWidth: 1, borderColor: colors.stone, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}><AppText style={{ fontSize: 12, color: colors.fern }}>Subtotal before taxes</AppText><AppText selectable style={{ fontFamily: fonts.bold, fontSize: 20 }}>{money(estimate.subtotal)}</AppText></View>
      <Button label="Continue to payment" icon="arrow" onPress={continueToPayment} />
    </View>
  </KeyboardAvoidingView>;
}
