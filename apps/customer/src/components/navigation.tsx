import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { AppText } from '@/components/ui';
import { Icon, type IconName } from '@/components/icon';
import { colors, fonts } from '@/theme';

const items: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Explore', icon: 'search' },
  deals: { label: 'Offers', icon: 'tag' },
  bookings: { label: 'Bookings', icon: 'ticket' },
  profile: { label: 'Profile', icon: 'user' },
};
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
export function Navigation({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.stone, paddingBottom: Math.max(insets.bottom, 9), paddingTop: 7, flexDirection: 'row', paddingHorizontal: 10 }}>
    {state.routes.map((route, index) => {
      const item = items[route.name];
      if (!item) return null;
      const selected = index === state.index;
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }}
        onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) navigation.navigate(route.name); }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 52 }}>
        <View style={{ paddingVertical: 4 }}><Icon name={item.icon} size={23} color={selected ? colors.pine : colors.fern} /></View>
        <AppText style={{ fontSize: 10, lineHeight: 17, fontFamily: selected ? fonts.bold : fonts.medium, color: selected ? colors.pine : colors.fern }}>{item.label}</AppText>
      </Pressable>;
    })}
  </View>;
}

