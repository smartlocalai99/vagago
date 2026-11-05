import { useEffect, useRef, type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/icon';
import { settle } from '@/components/motion';
import { colors, fonts } from '@/theme';

const items: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Explore', icon: 'search' },
  deals: { label: 'Offers', icon: 'tag' },
  bookings: { label: 'Bookings', icon: 'ticket' },
  profile: { label: 'Profile', icon: 'user' },
};
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// Floating bar: only the current tab shows its name, inside a pill that slides and
// stretches to the tapped tab while the other icons make room.
export function Navigation({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const placed = useRef(false);
  const activeKey = state.routes[state.index].key;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.get() }], width: pillWidth.get() }));

  const movePill = (key: string) => {
    const layout = layouts.current[key];
    if (!layout || key !== activeKey) return;
    if (!placed.current) {
      pillX.set(layout.x);
      pillWidth.set(layout.width);
      placed.current = true;
    } else {
      pillX.set(withSpring(layout.x, settle));
      pillWidth.set(withSpring(layout.width, settle));
    }
  };
  useEffect(() => movePill(activeKey));

  const bottom = Math.max(insets.bottom - 6, 12);
  return <>
    <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', colors.white]} locations={[0, 0.55, 1]}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bottom + 96 }} />
    <View style={{ position: 'absolute', left: 16, right: 16, bottom, height: 62, borderRadius: 31, borderCurve: 'continuous', backgroundColor: colors.white,
      boxShadow: '0 8px 28px rgba(0,0,0,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 8, bottom: 8, borderRadius: 23, backgroundColor: colors.meadow }, pill]} />
      {state.routes.map((route, index) => {
        const item = items[route.name];
        if (!item) return null;
        const selected = index === state.index;
        return <Animated.View key={route.key} layout={LinearTransition.springify().damping(settle.damping).stiffness(settle.stiffness)}
          onLayout={(event) => { layouts.current[route.key] = { x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width }; movePill(route.key); }}>
          <Pressable accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }}
            onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) navigation.navigate(route.name); }}
            style={{ height: 46, minWidth: 46, paddingHorizontal: selected ? 16 : 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <Icon name={item.icon} size={22} color={selected ? colors.pine : colors.fern} />
            {selected ? <Animated.Text entering={FadeIn.duration(220).delay(80)} exiting={FadeOut.duration(90)} numberOfLines={1}
              style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.pine }}>{item.label}</Animated.Text> : null}
          </Pressable>
        </Animated.View>;
      })}
    </View>
  </>;
}
