import { Linking, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { Icon } from '@/components/icon';
import { openDirections } from '@/components/directions';
import type { ExactAddress } from '@/state/bookings-context';
import { colors, fonts } from '@/theme';

export function ExactLocation({ address }: { address: ExactAddress | null | undefined }) {
  return <View style={{ gap: 12 }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.ink }}>Exact location</Text>
    <View style={{ borderWidth: 1, borderColor: colors.stone, borderRadius: 14, padding: 15, gap: 14 }}>
      {address ? <>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="pin" size={20} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text selectable style={{ fontFamily: fonts.semibold, fontSize: 14, lineHeight: 21, color: colors.ink }}>{address.addressLine}, {address.city}, {address.state} {address.postalCode}</Text>
            {address.arrivalInstructions ? <Text selectable style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.fern }}>{address.arrivalInstructions}</Text> : null}
          </View>
        </View>
        <Button label="Get directions" icon="navigation" onPress={() => openDirections({ latitude: address.latitude, longitude: address.longitude })} />
        {address.contactPhone ? <Button secondary label={`Call ${address.contactPhone}`} icon="phone" onPress={() => void Linking.openURL(`tel:${address.contactPhone}`)} /> : null}
      </> : <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.fern }}>{address === null ? 'Couldn’t load the address. Check your connection.' : 'Loading address…'}</Text>}
    </View>
  </View>;
}
