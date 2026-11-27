import { Text, View } from 'react-native';
import { money } from '@/data/stays';
import { discountPercent } from '@/data/search';
import { colors, fonts } from '@/theme';

export function PriceDisplay({ rate, compareAtRate, size = 19, showDiscount = true }: { rate: number; compareAtRate?: number; size?: number; showDiscount?: boolean }) {
  const discount = discountPercent(rate, compareAtRate);
  return <View style={{ gap: 5 }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6, rowGap: 2 }}>
      {discount ? <Text selectable accessibilityLabel={`Was ${money(compareAtRate!)}`} style={{ fontFamily: fonts.medium, color: colors.save, fontSize: 12, textDecorationLine: 'line-through' }}>{money(compareAtRate!)}</Text> : null}
      <Text selectable style={{ fontFamily: fonts.bold, color: discount ? colors.pine : colors.ink, fontSize: size, lineHeight: size * 1.4 }}>{money(rate)}</Text>
      <Text style={{ fontFamily: fonts.regular, color: colors.ink, fontSize: 12 }}>night</Text>
      {discount && showDiscount ? <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: colors.softSave, alignSelf: 'center' }}><Text style={{ fontFamily: fonts.bold, fontSize: 10, lineHeight: 16, color: colors.save }}>{discount}% off</Text></View> : null}
    </View>
  </View>;
}

// Large price with the old price struck through and the saving in golden yellow, as used on
// listing cards and the booking bar.
export function DealPrice({ rate, compareAtRate, size = 22, showDiscount = true }: { rate: number; compareAtRate?: number; size?: number; showDiscount?: boolean }) {
  const discount = discountPercent(rate, compareAtRate);
  return <View accessible accessibilityLabel={`${money(rate)} per night${discount ? `, was ${money(compareAtRate!)}, ${discount}% off` : ''}`}
    style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6 }}>
    <Text style={{ fontFamily: fonts.bold, color: colors.ink, fontSize: size, lineHeight: size * 1.3, fontVariant: ['tabular-nums'] }}>{money(rate)}</Text>
    {discount ? <Text style={{ fontFamily: fonts.medium, color: colors.save, fontSize: Math.round(size * 0.6), textDecorationLine: 'line-through', fontVariant: ['tabular-nums'] }}>{money(compareAtRate!)}</Text> : null}
    {discount && showDiscount ? <Text style={{ fontFamily: fonts.semibold, color: colors.save, fontSize: Math.round(size * 0.68) }}>{discount}% off</Text> : null}
  </View>;
}
