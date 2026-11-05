import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/icon';
import { formatDrive, formatKm, nearbyAttractions, useAttractions } from '@/data/attractions';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

function Dot({ index, scrollX, interval }: { index: number; scrollX: SharedValue<number>; interval: number }) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * interval, index * interval, (index + 1) * interval];
    return { width: interpolate(scrollX.get(), range, [6, 18, 6], Extrapolation.CLAMP), opacity: interpolate(scrollX.get(), range, [0.3, 1, 0.3], Extrapolation.CLAMP) };
  });
  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: colors.pine }, style]} />;
}

// Swipeable highlight cards with a stretching dot for the current card.
export function Highlights({ stay, gutter = 18 }: { stay: Stay; gutter?: number }) {
  const { width } = useWindowDimensions();
  const nearest = nearbyAttractions(stay.coordinates, useAttractions())[0];
  const items: { icon: IconName; label: string; text: string }[] = [
    { icon: 'cash', label: 'Payment', text: 'Pay at the stay. Nothing to pay now.' },
    ...(nearest ? [{ icon: 'pin' as const, label: 'Top location', text: `${nearest.name} is ${formatKm(nearest.roadKm)} away, about ${formatDrive(nearest.driveMinutes)} by road.` }] : []),
    { icon: 'home', label: 'Space', text: `The whole ${stay.stayStyle} is yours, for up to ${stay.capacity} guests.` },
    { icon: 'lock', label: 'Arrival', text: 'Exact address and directions unlock as soon as you book.' },
  ];
  const cardWidth = width - gutter * 2 - 44;
  const gap = 12;
  const interval = cardWidth + gap;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => { scrollX.set(event.contentOffset.x); });

  return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.ink }}>Highlights</Text>
    <Animated.ScrollView horizontal onScroll={onScroll} scrollEventThrottle={16} snapToInterval={interval} decelerationRate="fast" showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -gutter }} contentContainerStyle={{ paddingHorizontal: gutter, gap }}>
      {items.map((item) => <View key={item.label} style={{ width: cardWidth, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.white, boxShadow: '0 4px 18px rgba(0,0,0,0.08)', marginVertical: 6 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.meadow, alignItems: 'center', justifyContent: 'center' }}><Icon name={item.icon} size={21} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.fern }}>{item.label}</Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.ink }}>{item.text}</Text>
        </View>
      </View>)}
    </Animated.ScrollView>
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
      {items.map((item, index) => <Dot key={item.label} index={index} scrollX={scrollX} interval={interval} />)}
    </View>
  </View>;
}
