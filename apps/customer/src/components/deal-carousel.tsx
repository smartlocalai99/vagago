import { Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { PressScale } from '@/components/motion';
import { Icon } from '@/components/icon';
import { money } from '@/data/stays';
import { discountPercent } from '@/data/search';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

function DealCard({ stay, index, scrollX, interval, width }: { stay: Stay; index: number; scrollX: SharedValue<number>; interval: number; width: number }) {
  const discount = discountPercent(stay.nightlyRate, stay.compareAtRate);
  // The centred card is full size; neighbours shrink and dim as they move away.
  const style = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.get(), [(index - 1) * interval, index * interval, (index + 1) * interval], [0.88, 1, 0.88], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity: interpolate(scale, [0.88, 1], [0.7, 1]) };
  });
  return <Animated.View style={[{ width }, style]}>
    <PressScale accessibilityRole="button" accessibilityLabel={`${stay.name}, ${money(stay.nightlyRate)} per night${discount ? `, ${discount}% off` : ''}`}
      onPress={() => router.push(`/stay/${stay.id}`)}
      style={{ backgroundColor: colors.white, borderRadius: 24, borderCurve: 'continuous', padding: 10, boxShadow: '0 6px 22px rgba(0,0,0,0.10)' }}>
      <View>
        <Image source={stay.image} contentFit="cover" cachePolicy="memory-disk" transition={200} accessible={false}
          style={{ width: '100%', aspectRatio: 1.25, borderRadius: 18, backgroundColor: colors.stone }} />
        {discount ? <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: colors.save, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.white }}>{discount}% off</Text>
        </View> : null}
      </View>
      <View style={{ paddingHorizontal: 6, paddingTop: 12, paddingBottom: 4, gap: 3 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 17, color: colors.ink }}>{stay.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="pin" size={13} color={colors.fern} />
          <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.fern, flexShrink: 1 }}>{stay.area}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.fern }}>From <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: colors.ink }}>{money(stay.nightlyRate)}</Text></Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.softSave, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Icon name="cash" size={13} color={colors.save} /><Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: colors.save }}>Pay at stay</Text>
          </View>
        </View>
      </View>
    </PressScale>
  </Animated.View>;
}

// Snapping carousel with the active card centred, like the reference's recommendations row.
export function DealCarousel({ stays }: { stays: Stay[] }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(320, Math.round(screenWidth * 0.74));
  const gap = 12;
  const interval = width + gap;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => { scrollX.set(event.contentOffset.x); });
  return <Animated.ScrollView horizontal onScroll={onScroll} scrollEventThrottle={16} snapToInterval={interval} decelerationRate="fast" disableIntervalMomentum
    showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: (screenWidth - width) / 2, gap, paddingVertical: 8 }}>
    {stays.map((stay, index) => <DealCard key={stay.id} stay={stay} index={index} scrollX={scrollX} interval={interval} width={width} />)}
  </Animated.ScrollView>;
}
