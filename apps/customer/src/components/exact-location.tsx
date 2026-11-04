import { Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { Icon } from '@/components/icon';
import { openDirections } from '@/components/directions';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

export function ExactLocation({ stay }: { stay: Stay }) {
  return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.ink }}>Exact location</Text>
    <View style={{ borderWidth: 1, borderColor: colors.stone, borderRadius: 14, padding: 15, gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Icon name="pin" size={20} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text selectable style={{ fontFamily: fonts.semibold, fontSize: 14, lineHeight: 21, color: colors.ink }}>{stay.address}</Text>
          <Text selectable style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.fern, fontVariant: ['tabular-nums'] }}>{stay.coordinates.latitude.toFixed(4)}, {stay.coordinates.longitude.toFixed(4)}</Text>
        </View>
      </View>
      <Button label="Get directions" icon="navigation" onPress={() => openDirections(stay.coordinates)} />
    </View>
  </View>;
}
