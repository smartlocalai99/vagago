import { useEffect, useRef, type ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/icon';
import { ease, swap } from '@/components/motion';
import { useLaunched } from '@/state/launch-context';
import { colors, fonts } from '@/theme';

const items: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Explore', icon: 'search' },
  deals: { label: 'Offers', icon: 'tag' },
  bookings: { label: 'Bookings', icon: 'ticket' },
  profile: { label: 'Profile', icon: 'user' },
};
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// The pill's leading edge reaches the new tab first and the trailing edge follows, so it
// stretches across and settles without bouncing, as in the reference.
const lead = { duration: 240, easing: swap };
const trail = { duration: 400, easing: swap };

export function Navigation({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const launched = useLaunched();
  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const left = useSharedValue(0);
  const right = useSharedValue(0);
  const placed = useRef(false);
  const rise = useSharedValue(0);
  const activeKey = state.routes[state.index].key;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: left.get() }], width: right.get() - left.get() }));
  const bar = useAnimatedStyle(() => ({ opacity: rise.get(), transform: [{ translateY: 90 * (1 - rise.get()) }] }));

  // The bar rises in last, after the first screen has zoomed into place.
  useEffect(() => {
    if (launched) rise.set(withDelay(420, withTiming(1, { duration: 420, easing: ease })));
  }, [launched, rise]);

  const movePill = (key: string) => {
    const layout = layouts.current[key];
    if (!layout || key !== activeKey) return;
    const nextLeft = layout.x;
    const nextRight = layout.x + layout.width;
    if (!placed.current) {
      left.set(nextLeft);
      right.set(nextRight);
      placed.current = true;
      return;
    }
    const movingRight = nextLeft > left.get();
    left.set(withTiming(nextLeft, movingRight ? trail : lead));
    right.set(withTiming(nextRight, movingRight ? lead : trail));
  };
  useEffect(() => movePill(activeKey));

  const bottom = Math.max(insets.bottom - 6, 12);
  return <>
    <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', colors.white]} locations={[0, 0.55, 1]}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bottom + 96 }} />
    <Animated.View style={[{ position: 'absolute', left: 16, right: 16, bottom, height: 62, borderRadius: 31, borderCurve: 'continuous', backgroundColor: colors.white,
      boxShadow: '0 8px 28px rgba(0,0,0,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 }, bar]}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 8, bottom: 8, borderRadius: 23, backgroundColor: colors.meadow }, pill]} />
      {state.routes.map((route, index) => {
        const item = items[route.name];
        if (!item) return null;
        const selected = index === state.index;
        return <Animated.View key={route.key} layout={LinearTransition.duration(320).easing(swap)}
          onLayout={(event) => { layouts.current[route.key] = { x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width }; movePill(route.key); }}>
          <Pressable accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }}
            onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) navigation.navigate(route.name); }}
            style={{ height: 46, minWidth: 46, paddingHorizontal: selected ? 16 : 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <Icon name={item.icon} size={22} color={selected ? colors.pine : colors.fern} />
            {selected ? <Animated.Text entering={FadeIn.duration(220).delay(220)} exiting={FadeOut.duration(100)} numberOfLines={1}
              style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.pine }}>{item.label}</Animated.Text> : null}
          </Pressable>
        </Animated.View>;
      })}
    </Animated.View>
  </>;
}
