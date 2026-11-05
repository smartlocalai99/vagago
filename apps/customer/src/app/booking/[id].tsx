import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, EmptyState, Heading, Page } from '@/components/ui';
import { formatDate } from '@/components/escape-summary';
import { ExactLocation } from '@/components/exact-location';
import { Icon } from '@/components/icon';
import { NearbyPlaces } from '@/components/nearby-places';
import { ReviewForm } from '@/components/review-form';
import { money } from '@/data/stays';
import { useBookings, type ExactAddress } from '@/state/bookings-context';
import { useStays } from '@/state/catalog-context';
import { colors, fonts } from '@/theme';

const statusLabels = { confirmed: 'Confirmed', checked_in: 'Checked in', completed: 'Completed', cancelled: 'Cancelled', no_show: 'Marked as no-show' } as const;

function Row({ label, value }: { label: string; value: string }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
    <AppText style={{ fontSize: 13, color: colors.fern }}>{label}</AppText>
    <AppText selectable style={{ fontSize: 13, fontFamily: fonts.semibold, flexShrink: 1, textAlign: 'right' }}>{value}</AppText>
  </View>;
}

export default function BookingDetails() {
  const { id, confirmed } = useLocalSearchParams<{ id: string; confirmed?: string }>();
  const { bookings, cancelBooking, getAddress } = useBookings();
  const stays = useStays();
  const insets = useSafeAreaInsets();
  const booking = bookings.find((item) => item.id === id);
  const stay = booking ? stays.find((item) => item.id === booking.stayId) : undefined;
  const active = booking?.status === 'confirmed' || booking?.status === 'checked_in';
  const [address, setAddress] = useState<ExactAddress | null | undefined>(undefined);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!booking || !active) return;
    let mounted = true;
    void getAddress(booking.id).then((result) => { if (mounted) setAddress(result); });
    return () => { mounted = false; };
  }, [active, booking, getAddress]);

  if (!booking) return <Page><Stack.Screen options={{ title: 'Your booking' }} /><EmptyState icon="ticket" title="Booking not found" body="This booking is no longer on this phone." action="View bookings" onAction={() => router.replace('/bookings')} /></Page>;

  const room = stay?.rooms.find((option) => option.id === booking.roomOptionId);
  const cancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(booking.id);
    } catch (error) {
      Alert.alert('Booking not cancelled', error instanceof Error ? error.message : 'Please try again.');
    }
    setCancelling(false);
  };
  const confirmCancel = () => process.env.EXPO_OS === 'web'
    ? globalThis.confirm?.('Cancel this booking?') && void cancel()
    : Alert.alert('Cancel this booking?', `${stay?.name ?? 'Your stay'}, ${formatDate(booking.checkIn)}`, [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => void cancel() },
    ]);

  return <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
    <Stack.Screen options={{ title: 'Your booking' }} />
    {confirmed && booking.status === 'confirmed' ? <View style={{ backgroundColor: colors.meadow, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.pine, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={19} color={colors.white} /></View>
      <View style={{ flex: 1, gap: 1 }}><Heading size={17}>Booking confirmed</Heading><AppText style={{ fontSize: 12, color: colors.fern }}>Your exact address and directions are below.</AppText></View>
    </View> : null}
    {!active && !confirmed ? <View style={{ backgroundColor: booking.status === 'completed' ? colors.canvas : colors.softError, paddingHorizontal: 20, paddingVertical: 14 }}>
      <AppText style={{ color: booking.status === 'completed' ? colors.ink : colors.error, fontFamily: fonts.semibold, fontSize: 13 }}>{statusLabels[booking.status]}</AppText>
    </View> : null}
    {stay ? <Image source={stay.image} contentFit="cover" cachePolicy="memory-disk" style={{ width: '100%', aspectRatio: 1.6, backgroundColor: colors.stone }} accessibilityLabel={`${stay.name} photo`} /> : null}
    <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 26 }}>
      <View style={{ gap: 4 }}>
        <Heading size={24}>{stay?.name ?? 'Your stay'}</Heading>
        <AppText style={{ fontSize: 12, color: colors.fern }}>Booking {booking.reference} · {statusLabels[booking.status]}</AppText>
      </View>
      <View style={{ gap: 11 }}>
        <Row label="Check-in" value={formatDate(booking.checkIn)} />
        <Row label="Check-out" value={formatDate(booking.checkOut)} />
        <Row label="Guests" value={`${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'} · ${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`} />
        {room ? <Row label="Stay" value={room.name} /> : null}
        <Row label="Booked by" value={booking.guest.fullName} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: colors.stone, paddingTop: 12 }}>
          <AppText style={{ fontSize: 13, fontFamily: fonts.bold }}>Pay at check-in</AppText>
          <AppText selectable style={{ fontSize: 17, fontFamily: fonts.bold }}>{money(booking.total)}</AppText>
        </View>
        <AppText style={{ fontSize: 11, color: colors.fern }}>Plus taxes and fees charged by the property.</AppText>
      </View>
      {booking.status === 'completed' ? <ReviewForm booking={booking} /> : null}
      {active ? <ExactLocation address={address} /> : null}
      {stay ? <NearbyPlaces stay={stay} directions={active} /> : null}
      {booking.status === 'confirmed' ? <Pressable accessibilityRole="button" disabled={cancelling} onPress={confirmCancel} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: cancelling ? 0.5 : 1 }}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.error, textDecorationLine: 'underline' }}>{cancelling ? 'Cancelling…' : 'Cancel booking'}</AppText>
      </Pressable> : null}
    </View>
  </ScrollView>;
}
