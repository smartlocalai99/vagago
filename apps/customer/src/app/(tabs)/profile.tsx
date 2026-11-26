import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LockedPrompt, LoginPrompt, useGate } from '@/components/account-gate';
import { Icon, type IconName } from '@/components/icon';
import { Reveal } from '@/components/motion';
import { AppText, Heading, Page } from '@/components/ui';
import { useAccount } from '@/state/account-context';
import { colors, fonts } from '@/theme';

const rows: { title: string; subtitle: string; icon: IconName; route: '/bookings' | '/deals' | '/faq' }[] = [
  { title: 'My bookings', subtitle: 'Upcoming, past and cancelled stays', icon: 'ticket', route: '/bookings' },
  { title: 'Offers', subtitle: 'First-stay and monthly discounts', icon: 'tag', route: '/deals' },
  { title: 'Questions and answers', subtitle: 'Payment, cancellation and finding your booking', icon: 'info', route: '/faq' },
];

export default function Profile() {
  const gate = useGate();
  const { account, logout, login } = useAccount();

  const confirmLogout = () => Alert.alert('Log out?', 'Your details are removed from this phone. Log in again any time to see your bookings.', [
    { text: 'Stay logged in', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: () => void logout() },
  ]);
  const toggleLock = () => account && void login({ name: account.name, mobile: account.mobile, lock: !account.lock });
  const initials = account?.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '';

  return <Page tabs>
    <Heading size={24}>Profile</Heading>
    {gate === 'signed-out' ? <LoginPrompt title="Log in to VagaGo" body="Save your name and number for one-tap booking, and keep your bookings private with Face ID." />
      : gate === 'locked' ? <LockedPrompt />
      : gate === 'open' && account ? <>
        <Reveal style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 20, backgroundColor: colors.brand }}>
          <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.white }}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.white }}>{account.name}</Text>
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>+91 {account.mobile.replace(/(\d{5})(\d{5})/, '$1 $2')}</Text>
          </View>
        </Reveal>
        <Reveal delay={80}>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: account.lock }} onPress={toggleLock}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.stone, opacity: pressed ? 0.7 : 1 })}>
            <Icon name="lock" size={21} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText style={{ fontFamily: fonts.semibold }}>Face ID or screen lock</AppText>
              <AppText style={{ fontSize: 12, color: colors.fern }}>{account.lock ? 'On: asked when you open your profile or bookings' : 'Off: tap to turn on'}</AppText>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: account.lock ? colors.softSave : colors.canvas }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: account.lock ? colors.save : colors.fern }}>{account.lock ? 'On' : 'Off'}</Text>
            </View>
          </Pressable>
        </Reveal>
      </> : null}
    <Reveal delay={140} style={{ borderTopWidth: 1, borderColor: colors.stone }}>
      {rows.map((item) => <Pressable key={item.route} accessibilityRole="button" onPress={() => router.navigate(item.route)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 20, borderBottomWidth: 1, borderColor: colors.stone, opacity: pressed ? 0.65 : 1 })}>
        <Icon name={item.icon} size={22} /><View style={{ flex: 1, gap: 3 }}><AppText style={{ fontFamily: fonts.semibold }}>{item.title}</AppText><AppText style={{ fontSize: 12, color: colors.fern }}>{item.subtitle}</AppText></View><Icon name="chevron" size={17} />
      </Pressable>)}
    </Reveal>
    {gate === 'open' ? <Pressable accessibilityRole="button" onPress={confirmLogout} style={({ pressed }) => ({ minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.stone, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <AppText style={{ fontFamily: fonts.bold, color: colors.error }}>Log out</AppText>
    </Pressable> : null}
  </Page>;
}
