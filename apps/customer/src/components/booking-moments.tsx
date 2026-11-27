import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { ease, Reveal } from '@/components/motion';
import { bookingFee } from '@/data/offers';
import { colors, fonts } from '@/theme';

// Shown once after booking: the check pops in, a ring pulses out twice, then the text rises in.
export function BookingConfirmed({ reference }: { reference: string }) {
  const pop = useSharedValue(0);
  const ring = useSharedValue(0);
  useEffect(() => {
    pop.set(withSequence(withTiming(1.15, { duration: 320, easing: ease }), withTiming(1, { duration: 200, easing: ease })));
    ring.set(withDelay(200, withRepeat(withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }), 2, false)));
  }, [pop, ring]);
  const circle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }], opacity: Math.min(1, pop.get() * 1.5) }));
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: 1 + ring.get() * 0.9 }], opacity: 0.45 * (1 - ring.get()) }));
  return <LinearGradient colors={[colors.brand, '#0E5A40']} style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 14 }}>
    <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: colors.white }, pulse]} />
      <Animated.View style={[{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }, circle]}>
        <Icon name="check" size={36} color={colors.brand} />
      </Animated.View>
    </View>
    <Reveal delay={280} style={{ alignItems: 'center', gap: 4 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.white }}>Booking confirmed</Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>Booking {reference}. Your exact address and directions are below.</Text>
    </Reveal>
  </LinearGradient>;
}

// The flat booking fee, presented plainly: one small fixed amount, nothing hidden.
export function BookingFeeCard() {
  return <Reveal from="grow" duration={460}>
    <LinearGradient colors={['#FDECEE', '#FFF8F4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#F6CDD3' }}>
      <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, color: 'rgba(255,255,255,0.8)' }}>FLAT</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: colors.white, paddingHorizontal: 4 }}>₹{bookingFee}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }}>Just ₹{bookingFee} booking fee</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.fern }}>The same small fee on every booking, whatever the stay. No hidden charges, no surprises.</Text>
      </View>
      <Icon name="shield" size={22} color={colors.action} />
    </LinearGradient>
  </Reveal>;
}
