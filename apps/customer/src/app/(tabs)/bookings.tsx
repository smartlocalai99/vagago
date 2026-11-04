import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText, EmptyState, Heading, Page } from '@/components/ui';
import { formatDate } from '@/components/escape-summary';
import { Icon } from '@/components/icon';
import { stays } from '@/data/stays';
import { useBookings, type Booking } from '@/state/bookings-context';
import { getTodayInKolkata } from '@vagago/domain';
import { colors, fonts } from '@/theme';

const bookingTabs = ['Upcoming', 'Past', 'Cancelled'] as const;
type BookingTab = typeof bookingTabs[number];

function tabFor(booking: Booking, today: string): BookingTab {
  if (booking.status === 'cancelled') return 'Cancelled';
  return booking.checkOut < today ? 'Past' : 'Upcoming';
}

export default function Bookings() {
  const [selected, setSelected] = useState<BookingTab>('Upcoming');
  const { bookings } = useBookings();
  const today = getTodayInKolkata();
  const visible = bookings.filter((booking) => tabFor(booking, today) === selected)
    .sort((a, b) => selected === 'Upcoming' ? a.checkIn.localeCompare(b.checkIn) : b.checkIn.localeCompare(a.checkIn));
  const description = selected === 'Upcoming'
    ? 'Book a stay and it will appear here with the exact address and directions.'
    : selected === 'Past' ? 'Your completed stays will appear here.' : 'Bookings you cancel will appear here.';

  return <Page tabs>
    <Heading size={24}>Bookings</Heading>
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.stone }}>
      {bookingTabs.map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: selected === tab }} aria-selected={selected === tab} onPress={() => setSelected(tab)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderColor: selected === tab ? colors.pine : 'transparent' }}><AppText style={{ fontFamily: selected === tab ? fonts.bold : fonts.medium, fontSize: 12, color: selected === tab ? colors.pine : colors.fern }}>{tab}</AppText></Pressable>)}
    </View>
    {visible.length ? <View style={{ gap: 18 }}>
      {visible.map((booking) => {
        const stay = stays.find((item) => item.id === booking.stayId);
        if (!stay) return null;
        return <Pressable key={booking.id} accessibilityRole="button" accessibilityLabel={`${stay.name}, ${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}`}
          onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}
          style={({ pressed }) => ({ flexDirection: 'row', gap: 14, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Image source={stay.image} contentFit="cover" style={{ width: 92, height: 92, borderRadius: 12 }} accessible={false} />
          <View style={{ flex: 1, gap: 3 }}>
            <AppText style={{ fontFamily: fonts.bold, fontSize: 15 }}>{stay.name}</AppText>
            <AppText style={{ fontSize: 12, color: colors.fern }}>{formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}</AppText>
            <AppText style={{ fontSize: 12, color: colors.fern }}>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'} · {booking.reference}</AppText>
            {booking.status === 'confirmed' && selected === 'Upcoming' ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 2 }}><Icon name="pin" size={13} /><AppText style={{ fontSize: 11, color: colors.pine, fontFamily: fonts.semibold }}>Address and directions</AppText></View> : null}
          </View>
          <Icon name="chevron" size={16} color={colors.fern} />
        </Pressable>;
      })}
    </View> : <EmptyState icon="ticket" title={`No ${selected.toLowerCase()} bookings`} body={description} action="Explore stays" onAction={() => router.navigate('/')} />}
  </Page>;
}
