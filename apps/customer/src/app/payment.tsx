import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { estimateStaySubtotal, validateGetawayDraft } from '@vagago/domain';
import { AppText, Button, EmptyState, Heading, Page } from '@/components/ui';
import { Icon } from '@/components/icon';
import { useEscape, validateBookingGuest } from '@/state/escape-context';
import { useBookings } from '@/state/bookings-context';
import { getRoomOptions } from '@/data/room-options';
import { money } from '@/data/stays';
import { useStays } from '@/state/catalog-context';
import { colors, fonts } from '@/theme';

export default function Payment() {
  const { draft, bookingGuest, updateDraft } = useEscape();
  const { createBooking } = useBookings();
  const stays = useStays();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [method, setMethod] = useState<'stay'>('stay');
  const [confirming, setConfirming] = useState(false);
  const insets = useSafeAreaInsets();
  const stay = stays.find((item) => item.id === draft.stayId);
  const room = stay ? getRoomOptions(stay).find((option) => option.id === draft.roomOptionId) : undefined;
  const estimate = room ? estimateStaySubtotal(room.nightlyRate, draft.checkIn, draft.checkOut) : null;
  const valid = validateGetawayDraft(draft).valid && Object.keys(validateBookingGuest(bookingGuest)).length === 0
    && draft.roomCount === 1 && room && room.capacity >= draft.guests;

  if (!valid || !stay || !room || !estimate) return <Page><Stack.Screen options={{ title: 'Payment' }} /><EmptyState title="Complete your booking details" body="Choose your stay and add the guest details before selecting payment." action="Review booking" onAction={() => router.replace('/review')} icon="user" /></Page>;

  const confirmBooking = async () => {
    if (confirming) return;
    setConfirming(true);
    setBookingError(null);
    try {
      const booking = await createBooking({ roomOptionId: room.id, checkIn: draft.checkIn, checkOut: draft.checkOut, guests: draft.guests, guest: bookingGuest });
      updateDraft({ stayId: null, roomOptionId: null });
      router.dismissAll();
      router.push({ pathname: '/booking/[id]', params: { id: booking.id, confirmed: '1' } });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Couldn’t confirm your booking. Please try again.');
      setConfirming(false);
    }
  };

  return <View style={{ flex: 1, backgroundColor: colors.white }}>
    <Stack.Screen options={{ title: 'Payment' }} />
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 28, gap: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon name="check" size={19} /><AppText style={{ fontSize: 12, color: colors.fern }}>Booking details</AppText><View style={{ flex: 1, height: 1, backgroundColor: colors.stone }} /><View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.pine, alignItems: 'center', justifyContent: 'center' }}><AppText style={{ fontSize: 11, fontFamily: fonts.bold, color: colors.white }}>2</AppText></View><AppText style={{ fontSize: 12, fontFamily: fonts.bold }}>Payment</AppText></View>
      <View style={{ gap: 5 }}><Heading size={21}>How would you like to pay?</Heading><AppText style={{ color: colors.fern, fontSize: 12 }}>Choose a payment method for your stay.</AppText></View>
      <View style={{ gap: 12 }}>
        {([{ id: 'stay', title: 'Pay at the stay', subtitle: 'UPI, card or cash when you check in', icon: 'home', available: true }] as const).map((item) => {
          const selected = method === item.id;
          return <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.title} accessibilityState={{ checked: selected, disabled: !item.available }} aria-checked={selected} disabled={!item.available} onPress={() => setMethod(item.id)} style={({ pressed }) => ({ padding: 16, borderWidth: selected ? 1.5 : 1, borderColor: selected ? colors.pine : colors.stone, borderRadius: 14, gap: 14, backgroundColor: selected ? colors.meadow : colors.white, opacity: !item.available ? 0.5 : pressed ? 0.8 : 1 })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 42, height: 42, borderRadius: 11, borderWidth: 1, borderColor: colors.stone, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}><Icon name={item.icon} size={22} /></View><View style={{ flex: 1, gap: 3 }}><AppText style={{ fontFamily: fonts.bold, fontSize: 14 }}>{item.title}</AppText><AppText style={{ color: colors.fern, fontSize: 11, lineHeight: 17 }}>{item.subtitle}</AppText></View><View style={{ width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, borderColor: selected ? colors.pine : colors.fern, alignItems: 'center', justifyContent: 'center' }}>{selected ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colors.pine }} /> : null}</View></View>
            {selected ? <AppText style={{ fontSize: 11, lineHeight: 18, color: colors.fern, paddingTop: 11, borderTopWidth: 1, borderColor: colors.stone }}>Nothing to pay now. Settle the bill with your host at check-in.</AppText> : null}
          </Pressable>;
        })}
      </View>
      <View style={{ gap: 13, paddingTop: 22, borderTopWidth: 1, borderColor: colors.stone }}>
        <Heading size={18}>Booking summary</Heading>
        <View style={{ gap: 4 }}><AppText style={{ fontFamily: fonts.semibold }}>{stay.name}</AppText><AppText style={{ fontSize: 12, color: colors.fern }}>{room.name} · {estimate.nights} nights · {draft.guests} {draft.guests === 1 ? 'guest' : 'guests'}</AppText></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 13 }}>Accommodation</AppText><AppText selectable style={{ fontSize: 13 }}>{money(estimate.subtotal)}</AppText></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 12, color: colors.fern }}>Taxes and fees</AppText><AppText style={{ fontSize: 12, color: colors.fern }}>Paid at the property</AppText></View>
        <AppText style={{ fontSize: 11, lineHeight: 18, color: colors.fern }}>Taxes and fees are added by the property at check-in.</AppText>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><AppText style={{ fontFamily: fonts.semibold, fontSize: 13, textDecorationLine: 'underline', color: colors.pine }}>Edit booking details</AppText></Pressable>
    </ScrollView>
    <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16), borderTopWidth: 1, borderColor: colors.stone, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}><AppText style={{ fontSize: 12, color: colors.fern }}>Subtotal before taxes</AppText><AppText selectable style={{ fontFamily: fonts.bold, fontSize: 20 }}>{money(estimate.subtotal)}</AppText></View>
      {bookingError ? <AppText selectable style={{ color: colors.error, fontSize: 12, lineHeight: 18 }}>{bookingError}</AppText> : null}
      <Button label={confirming ? 'Confirming…' : 'Confirm booking'} icon={confirming ? null : 'check'} disabled={confirming} onPress={() => void confirmBooking()} />
      <AppText style={{ color: colors.fern, fontSize: 10, lineHeight: 16, textAlign: 'center' }}>You’ll see the exact address and directions right after booking.</AppText>
    </View>
  </View>;
}
