import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { estimateStaySubtotal } from '@vagago/domain';
import { Icon, type IconName } from '@/components/icon';
import { StayGallery } from '@/components/stay-gallery';
import { PriceDisplay } from '@/components/price-display';
import { colors, fonts } from '@/theme';
import { money } from '@/data/stays';
import { useEscape } from '@/state/escape-context';
import type { Stay } from '@/types';

export function AppText({ children, style, selectable = false }: PropsWithChildren<{ style?: TextStyle; selectable?: boolean }>) {
  return <Text selectable={selectable} style={[{ fontFamily: fonts.regular, color: colors.ink, fontSize: 14, lineHeight: 21 }, style]}>{children}</Text>;
}
export function Heading({ children, size = 22, style }: PropsWithChildren<{ size?: number; style?: TextStyle }>) {
  return <Text accessibilityRole="header" style={[{ fontFamily: fonts.bold, fontSize: size, lineHeight: size * 1.35, color: colors.ink, letterSpacing: -0.45 }, style]}>{children}</Text>;
}
export function Eyebrow({ children, light = false }: PropsWithChildren<{ light?: boolean }>) {
  return <AppText style={{ fontFamily: fonts.semibold, fontSize: 11, lineHeight: 18, color: light ? colors.white : colors.fern }}>{children}</AppText>;
}
export function Button({ label, onPress, secondary = false, icon = null, disabled = false, style }: { label: string; onPress: () => void; secondary?: boolean; icon?: IconName | null; disabled?: boolean; style?: ViewStyle }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [{ minHeight: 52, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: secondary ? colors.meadow : colors.pine, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}>
    <AppText style={{ fontFamily: fonts.bold, fontSize: 14, color: secondary ? colors.pine : colors.white, textAlign: 'center', flexShrink: 1 }}>{label}</AppText>{icon ? <Icon name={icon} size={18} color={secondary ? colors.pine : colors.white} /> : null}
  </Pressable>;
}
export function IconButton({ name, label, onPress, active = false, light = false }: { name: IconName; label: string; onPress: () => void; active?: boolean; light?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: light ? 'rgba(255,255,255,0.96)' : colors.meadow, opacity: pressed ? 0.7 : 1 })}><Icon name={name} size={21} filled={active} /></Pressable>;
}
export function Page({ children, tabs = false, style }: PropsWithChildren<{ tabs?: boolean; style?: ViewStyle }>) {
  const insets = useSafeAreaInsets();
  return <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentInsetAdjustmentBehavior={tabs ? 'never' : 'automatic'} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: tabs ? insets.top + 18 : 16, paddingBottom: tabs ? 110 + insets.bottom : 32 + insets.bottom, paddingHorizontal: 20, flexGrow: 1 }}><View style={[{ width: '100%', gap: 24 }, style]}>{children}</View></ScrollView>;
}
export function PreviewNotice({ compact = false }: { compact?: boolean }) {
  return <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center', paddingVertical: compact ? 0 : 11, paddingHorizontal: compact ? 0 : 12, backgroundColor: compact ? 'transparent' : colors.meadow, borderRadius: 9 }}><Icon name="info" size={13} color={colors.fern} /><AppText style={{ fontSize: 10, lineHeight: 16, color: colors.fern, flex: 1 }}>{compact ? 'Preview collection · sample stays and prices' : 'You’re exploring sample stays. Online booking opens soon.'}</AppText></View>;
}
export function SectionHeader({ title, eyebrow, action, onAction }: { title: string; eyebrow?: string; action?: string; onAction?: () => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><View style={{ gap: 3, flex: 1 }}>{eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}<Heading size={20}>{title}</Heading></View>{action && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 }}><AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.pine }}>{action}</AppText><Icon name="chevron" size={14} /></Pressable> : null}</View>;
}
export function StayCard({ stay, style }: { stay: Stay; style?: ViewStyle }) {
  const { draft } = useEscape();
  const estimate = estimateStaySubtotal(stay.nightlyRate, draft.checkIn, draft.checkOut);
  const openStay = () => router.push(`/stay/${stay.id}`);
  return <View style={style}>
    <StayGallery stay={stay} compact onOpen={openStay} />
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${stay.name} details`} onPress={openStay} style={({ pressed }) => ({ paddingHorizontal: 18, paddingTop: 2, paddingBottom: 20, gap: 2, opacity: pressed ? 0.75 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Heading size={17} style={{ flexShrink: 1 }}>{stay.name}</Heading>
        <PriceDisplay rate={stay.nightlyRate} compareAtRate={stay.compareAtRate} size={17} showDiscount={false} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <AppText style={{ color: colors.fern, fontSize: 12, flexShrink: 1 }}>{stay.area} · {stay.capacity} guests</AppText>
        {estimate ? <AppText style={{ fontSize: 12, color: colors.fern }}>{money(estimate.subtotal)} total</AppText> : null}
      </View>
    </Pressable>
  </View>;
}
export function EmptyState({ title, body, action, onAction, icon = 'search' }: { title: string; body: string; action: string; onAction: () => void; icon?: IconName }) {
  return <View style={{ paddingVertical: 30, paddingHorizontal: 10, gap: 16, alignItems: 'center' }}><View style={{ width: 74, height: 74, backgroundColor: colors.meadow, alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}><Icon name={icon} size={30} /></View><Heading size={21} style={{ textAlign: 'center' }}>{title}</Heading><AppText style={{ color: colors.fern, textAlign: 'center', fontSize: 13, lineHeight: 22 }}>{body}</AppText><Button label={action} onPress={onAction} /></View>;
}

