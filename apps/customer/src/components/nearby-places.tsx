import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/icon';
import { openDirections } from '@/components/directions';
import { formatDrive, formatKm, nearbyAttractions, useAttractions } from '@/data/attractions';
import { colors, fonts } from '@/theme';
import type { Stay } from '@/types';

export function NearbyPlaces({ stay, directions = false }: { stay: Stay; directions?: boolean }) {
  const places = nearbyAttractions(stay.coordinates, useAttractions());
  return <View style={{ gap: 6 }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.ink }}>Places to visit nearby</Text>
    <Text style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.fern }}>Approximate road distance and drive time from {stay.name}.</Text>
    <View style={{ marginTop: 6 }}>
      {places.map((place, index) => {
        const row = <>
          <Icon name="pin" size={18} color={colors.fern} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.ink }}>{place.name}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.fern }}>{place.kind}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 1 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.ink, fontVariant: ['tabular-nums'] }}>{formatKm(place.roadKm)}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.fern, fontVariant: ['tabular-nums'] }}>~{formatDrive(place.driveMinutes)}</Text>
          </View>
          {directions ? <Icon name="chevron" size={15} color={colors.fern} /> : null}
        </>;
        const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 11, borderTopWidth: index ? 1 : 0, borderColor: colors.stone };
        return directions
          ? <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={`Directions to ${place.name}, about ${formatKm(place.roadKm)}`} onPress={() => openDirections(place.coordinates, stay.coordinates)} style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}>{row}</Pressable>
          : <View key={place.id} style={style}>{row}</View>;
      })}
    </View>
  </View>;
}
