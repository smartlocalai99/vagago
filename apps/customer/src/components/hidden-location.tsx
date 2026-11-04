import { Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import { colors, fonts } from '@/theme';

export function HiddenLocation({ area, compact = false }: { area: string; compact?: boolean }) {
  return <View style={{ gap: 12 }}>
    {!compact ? <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.ink }}>Location</Text> : null}
    <View style={{ borderWidth: 1, borderColor: colors.stone, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.white }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 15 }}>
        <Icon name="pin" size={18} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.ink }}>{area}, Vagamon</Text>
      </View>
      <View style={{ minHeight: compact ? 76 : 100, backgroundColor: '#F0F4F1', justifyContent: 'center', paddingHorizontal: 22, overflow: 'hidden' }}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ gap: 17, opacity: 0.55 }}>
          {[0.78, 0.55, 0.65].map((length, index) => <View key={index} style={{ width: `${length * 100}%`, height: 7, borderRadius: 8, backgroundColor: '#AFC1B6', boxShadow: '0 0 7px 4px rgba(144,166,153,0.5)' }} />)}
        </View>
        <View style={{ position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.97)' }}>
          <Icon name="lock" size={15} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: colors.pine }}>Exact address hidden</Text>
        </View>
      </View>
      <Text style={{ padding: 15, fontFamily: fonts.regular, color: colors.fern, fontSize: 12, lineHeight: 19 }}>You’ll see the full address and directions as soon as you book.</Text>
    </View>
  </View>;
}
