import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { getTodayInKolkata } from '@vagago/domain';
import { PressScale, Reveal } from '@/components/motion';
import { AppText, Button, Heading, Page } from '@/components/ui';
import { isFirstStay, monthOffer, welcomeOffer, type Offer } from '@/data/offers';
import { useBookings } from '@/state/bookings-context';
import { colors, fonts } from '@/theme';

// A soft band of light that sweeps across the card every few seconds.
function Shine({ delay }: { delay: number }) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.set(withDelay(delay, withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }), -1, false)));
  }, [delay, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() * 420 }, { rotate: '18deg' }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -60, bottom: -60, width: 90 }, style]}>
    <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
  </Animated.View>;
}

function OfferCard({ offer, colorsFrom, badge, used, delay, note }: { offer: Offer; colorsFrom: [string, string]; badge: string; used?: boolean; delay: number; note: string }) {
  return <Reveal delay={delay} from="right" duration={560}>
    <PressScale accessibilityRole="button" accessibilityLabel={`${offer.title}. ${offer.percent}% off. Code ${offer.code}. ${used ? 'Already used.' : note}`}
      onPress={() => router.navigate('/')} style={{ borderRadius: 26, borderCurve: 'continuous', overflow: 'hidden', opacity: used ? 0.55 : 1 }}>
      <LinearGradient colors={colorsFrom} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22, gap: 14 }}>
        {used ? null : <Shine delay={delay + 700} />}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.white }}>{used ? 'Already used' : badge}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 52, lineHeight: 56, color: colors.white, letterSpacing: -2 }}>{offer.percent}%</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: -4 }}>OFF</Text>
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.white, letterSpacing: -0.4 }}>{offer.title}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.85)' }}>{offer.line}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
          <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.6)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.white, letterSpacing: 1.5 }}>{offer.code}</Text>
          </View>
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{note}</Text>
        </View>
      </LinearGradient>
    </PressScale>
  </Reveal>;
}

export default function Offers() {
  const { bookings } = useBookings();
  const firstStay = isFirstStay(bookings);
  const month = monthOffer();
  const today = getTodayInKolkata();
  const lastDay = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0));
  const until = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(lastDay);
  return <Page tabs>
    <Reveal style={{ gap: 4 }}>
      <Heading size={24}>Offers</Heading>
      <AppText style={{ color: colors.fern, fontSize: 13 }}>The best offer is applied for you when you book. One offer per booking.</AppText>
    </Reveal>
    <OfferCard offer={welcomeOffer} colorsFrom={[colors.brand, '#0E5A40']} badge="New guests" used={!firstStay} delay={80} note="On your first booking" />
    <OfferCard offer={month} colorsFrom={['#B7791F', '#E0A33A']} badge="This month" delay={180} note={`Valid till ${until}`} />
    <Reveal delay={280}><Button label="Find a stay" icon="arrow" onPress={() => router.navigate('/')} /></Reveal>
  </Page>;
}
