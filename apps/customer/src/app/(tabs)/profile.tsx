import { Alert, Linking, Pressable, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { LoginPrompt, useGate } from '@/components/account-gate';
import { Icon, type IconName } from '@/components/icon';
import { Reveal } from '@/components/motion';
import { AppText, Heading, Page } from '@/components/ui';
import { siteUrl } from '@/lib/site';
import { useAccount } from '@/state/account-context';
import { colors, fonts } from '@/theme';

type Row = { title: string; subtitle?: string; icon: IconName; onPress: () => void };

function Section({ title, rows, delay }: { title: string; rows: Row[]; delay: number }) {
  return <Reveal delay={delay} style={{ gap: 4 }}>
    <AppText style={{ fontSize: 12, fontFamily: fonts.bold, color: colors.fern }}>{title}</AppText>
    <View style={{ borderTopWidth: 1, borderColor: colors.stone }}>
      {rows.map((item) => <Pressable key={item.title} accessibilityRole="button" onPress={item.onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.stone, opacity: pressed ? 0.65 : 1 })}>
        <Icon name={item.icon} size={21} />
        <View style={{ flex: 1, gap: 2 }}><AppText style={{ fontFamily: fonts.semibold }}>{item.title}</AppText>{item.subtitle ? <AppText style={{ fontSize: 12, color: colors.fern }}>{item.subtitle}</AppText> : null}</View>
        <Icon name="chevron" size={16} color={colors.fern} />
      </Pressable>)}
    </View>
  </Reveal>;
}

export default function Profile() {
  const gate = useGate();
  const { account, logout, setLock, deleteAccount, canLock } = useAccount();
  const open = (path: string) => void Linking.openURL(`${siteUrl}${path}`);

  const confirmLogout = () => Alert.alert('Log out?', account?.lock ? 'Log back in any time with your mobile number and Face ID or your screen lock.' : 'Log back in any time with your mobile number.', [
    { text: 'Stay logged in', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: () => void logout() },
  ]);
  // Two steps, and a clear account of what deletion means, as the app stores require.
  const confirmDelete = () => Alert.alert('Delete your account?', 'This removes your name, number and reviews, cancels your upcoming bookings and logs you out on this phone. It can’t be undone.', [
    { text: 'Keep account', style: 'cancel' },
    { text: 'Delete account', style: 'destructive', onPress: () => void deleteAccount().then((problem) => Alert.alert(problem ? 'Account not deleted' : 'Account deleted', problem ?? 'Your account and personal details have been removed.')) },
  ]);
  const initials = account?.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '';
  const version = `${Constants.expoConfig?.version ?? ''}`;

  return <Page tabs>
    <Heading size={24}>Profile</Heading>
    {gate === 'signed-out' ? <LoginPrompt title="Log in to VagaGo" body="Save your name and number for one-tap booking. Log back in with Face ID or your screen lock." />
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
        {canLock ? <Reveal delay={60}>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: account.lock }} onPress={() => void setLock(!account.lock)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.stone, opacity: pressed ? 0.7 : 1 })}>
            <Icon name="lock" size={21} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText style={{ fontFamily: fonts.semibold }}>Log in with Face ID or screen lock</AppText>
              <AppText style={{ fontSize: 12, color: colors.fern }}>{account.lock ? 'On: your number plus Face ID logs you back in' : 'Off: tap to turn on'}</AppText>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: account.lock ? colors.softSave : colors.canvas }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: account.lock ? colors.save : colors.fern }}>{account.lock ? 'On' : 'Off'}</Text>
            </View>
          </Pressable>
        </Reveal> : null}
      </> : null}

    <Section title="Your trips" delay={100} rows={[
      { title: 'My bookings', subtitle: 'Upcoming, past and cancelled stays', icon: 'ticket', onPress: () => router.navigate('/bookings') },
      { title: 'Offers', subtitle: 'First-stay and monthly discounts', icon: 'tag', onPress: () => router.navigate('/deals') },
    ]} />
    <Section title="Help and legal" delay={160} rows={[
      { title: 'Questions and answers', icon: 'info', onPress: () => router.navigate('/faq') },
      { title: 'Contact support', subtitle: 'We usually reply within a day', icon: 'mail', onPress: () => router.navigate('/support') },
      { title: 'Privacy policy', icon: 'shield', onPress: () => open('/privacy/') },
      { title: 'Terms of use', icon: 'info', onPress: () => open('/terms/') },
    ]} />

    {gate === 'open' ? <Reveal delay={220} style={{ gap: 10 }}>
      <Pressable accessibilityRole="button" onPress={confirmLogout} style={({ pressed }) => ({ minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.stone, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
        <AppText style={{ fontFamily: fonts.bold }}>Log out</AppText>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={confirmDelete} style={({ pressed }) => ({ minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.error }}>Delete account</AppText>
      </Pressable>
    </Reveal> : null}
    <AppText style={{ textAlign: 'center', fontSize: 11, color: colors.fern }}>VagaGo {version}</AppText>
  </Page>;
}
