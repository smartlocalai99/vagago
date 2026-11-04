import { Text, View } from 'react-native';
import { money } from '@/data/stays';
import { colors, fonts } from '@/theme';

export function PriceDisplay({ rate, compareAtRate, size = 19, showDiscount = true }: { rate: number; compareAtRate?: number; size?: number; showDiscount?: boolean }) {
  const hasComparison = typeof compareAtRate === 'number' && Number.isFinite(compareAtRate) && compareAtRate > rate;
  const discount = hasComparison ? Math.round((1 - rate / compareAtRate) * 100) : 0;
  return <View style={{ gap: 5 }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6, rowGap: 2 }}>
      {hasComparison ? <Text selectable accessibilityLabel={`Sample comparison price ${money(compareAtRate)}`} style={{ fontFamily: fonts.regular, color: colors.fern, fontSize: 12, textDecorationLine: 'line-through' }}>{money(compareAtRate)}</Text> : null}
      <Text selectable style={{ fontFamily: fonts.bold, color: hasComparison ? colors.pine : colors.ink, fontSize: size, lineHeight: size * 1.4 }}>{money(rate)}</Text>
      <Text style={{ fontFamily: fonts.regular, color: colors.ink, fontSize: 12 }}>night</Text>
      {hasComparison && showDiscount ? <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: colors.meadow, alignSelf: 'center' }}><Text style={{ fontFamily: fonts.bold, fontSize: 10, lineHeight: 16, color: colors.pine }}>{discount}% off</Text></View> : null}
    </View>
  </View>;
}
