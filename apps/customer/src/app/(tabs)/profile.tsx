import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Heading, Page } from '@/components/ui';
import { Icon } from '@/components/icon';
import { useLocationContext } from '@/state/location-context';
import { colors, fonts } from '@/theme';

export default function Profile() {
  const { location } = useLocationContext();
  return <Page tabs>
    <Heading size={24}>Profile</Heading>
    <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center', paddingVertical: 12 }}>
      <View style={{ width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.meadow }}><Icon name="user" size={29} /></View>
      <View style={{ flex: 1, gap: 4 }}><Heading size={19}>Guest</Heading><AppText style={{ color: colors.fern, fontSize: 12 }}>Bookings are saved on this phone</AppText></View>
    </View>
    <View style={{ borderTopWidth: 1, borderColor: colors.stone }}>
      {([
        { title: 'My bookings', subtitle: 'Upcoming, past and cancelled stays', icon: 'ticket', route: '/bookings' },
        { title: 'Offers', subtitle: 'Limited-time prices on stays', icon: 'tag', route: '/deals' },
        { title: 'Location preferences', subtitle: location?.label ?? 'Manage your location preference', icon: 'pin', route: '/location' },
      ] as const).map((item) => <Pressable key={item.route} accessibilityRole="button" onPress={() => router.navigate(item.route)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 20, borderBottomWidth: 1, borderColor: colors.stone, opacity: pressed ? 0.65 : 1 })}>
        <Icon name={item.icon} size={22} /><View style={{ flex: 1, gap: 3 }}><AppText style={{ fontFamily: fonts.semibold }}>{item.title}</AppText><AppText style={{ fontSize: 12, color: colors.fern }}>{item.subtitle}</AppText></View><Icon name="chevron" size={17} />
      </Pressable>)}
    </View>
  </Page>;
}
