import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { estimateStaySubtotal } from '@vagago/domain';
import { Icon, type IconName } from '@/components/icon';
import { StayGallery } from '@/components/stay-gallery';
import { DealPrice } from '@/components/price-display';
import { PressScale } from '@/components/motion';
import { colors, fonts } from '@/theme';
import { money } from '@/data/stays';
import { useEscape } from '@/state/escape-context';
import type { Stay } from '@/types';

export function AppText({ children, style, selectable = false, numberOfLines }: PropsWithChildren<{ style?: TextStyle; selectable?: boolean; numberOfLines?: number }>) {
  return <Text selectable={selectable} numberOfLines={numberOfLines} style={[{ fontFamily: fonts.regular, color: colors.ink, fontSize: 14, lineHeight: 21 }, style]}>{children}</Text>;
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
const styleLabels: Record<Stay['stayStyle'], string> = { villa: 'Villa', cottage: 'Cottage', homestay: 'Homestay', resort: 'Resort', hotel: 'Hotel' };
export const stayStyleLabel = (stay: Stay) => styleLabels[stay.stayStyle];

export function Chip({ label, icon, tone = 'neutral' }: { label: string; icon?: IconName; tone?: 'neutral' | 'save' }) {
  const save = tone === 'save';
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: save ? colors.softSave : colors.canvas }}>
    {icon ? <Icon name={icon} size={14} color={save ? colors.save : colors.ink} /> : null}
    <Text style={{ fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: save ? colors.save : colors.ink }}>{label}</Text>
  </View>;
}

export function StayCard({ stay, style }: { stay: Stay; style?: ViewStyle }) {
  const { draft } = useEscape();
  const estimate = estimateStaySubtotal(stay.nightlyRate, draft.checkIn, draft.checkOut);
  const openStay = () => router.push(`/stay/${stay.id}`);
  return <PressScale accessibilityRole="button" accessibilityLabel={`View ${stay.name} details`} onPress={openStay} scaleTo={0.97}
    style={[{ marginHorizontal: 12, marginBottom: 16, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.white, boxShadow: '0 2px 12px rgba(0,0,0,0.09)' }, style]}>
    <View style={{ borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' }}>
      <StayGallery stay={stay} compact />
      <View pointerEvents="none" style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.white, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
        <Icon name="home" size={13} color={colors.ink} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.ink }}>{stayStyleLabel(stay)}</Text>
      </View>
    </View>
    <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 4 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <Chip icon="cash" label="Pay at stay" tone="save" />
        <Chip icon="users" label={`Up to ${stay.capacity} guests`} />
      </View>
      <AppText numberOfLines={2} style={{ fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 }}>{stay.name}</AppText>
      <AppText numberOfLines={1} style={{ color: colors.fern, fontSize: 13, lineHeight: 18 }}>{stay.area}, Vagamon</AppText>
      <View style={{ marginTop: 6 }}><DealPrice rate={stay.nightlyRate} compareAtRate={stay.compareAtRate} /></View>
      <AppText style={{ color: colors.fern, fontSize: 12, lineHeight: 17 }}>+ taxes & fees{estimate ? ` · ${money(estimate.subtotal)} for ${estimate.nights} ${estimate.nights === 1 ? 'night' : 'nights'}` : ''}</AppText>
    </View>
  </PressScale>;
}

export function EmptyState({ title, body, action, onAction, icon = 'search' }: { title: string; body: string; action: string; onAction: () => void; icon?: IconName }) {
  return <View style={{ paddingVertical: 30, paddingHorizontal: 10, gap: 16, alignItems: 'center' }}><View style={{ width: 74, height: 74, backgroundColor: colors.meadow, alignItems: 'center', justifyContent: 'center', borderRadius: 25 }}><Icon name={icon} size={30} /></View><Heading size={21} style={{ textAlign: 'center' }}>{title}</Heading><AppText style={{ color: colors.fern, textAlign: 'center', fontSize: 13, lineHeight: 22 }}>{body}</AppText><Button label={action} onPress={onAction} /></View>;
}

