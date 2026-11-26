import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, type IconName } from '@/components/icon';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui';
import { useAccount } from '@/state/account-context';
import { colors, fonts } from '@/theme';

export type GateState = 'loading' | 'signed-out' | 'open';

export function useGate(): GateState {
  const { ready, account } = useAccount();
  if (!ready) return 'loading';
  return account ? 'open' : 'signed-out';
}

function Prompt({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action: string; onAction: () => void }) {
  return <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 12, gap: 14 }}>
    <Reveal from="grow" duration={460}><View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: colors.meadow, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={32} /></View></Reveal>
    <Reveal delay={80} style={{ alignItems: 'center', gap: 6 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 21, color: colors.ink, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, color: colors.fern, textAlign: 'center', maxWidth: 300 }}>{body}</Text>
    </Reveal>
    <Reveal delay={160} style={{ alignSelf: 'stretch', paddingHorizontal: 24 }}><Button label={action} icon="arrow" onPress={onAction} /></Reveal>
  </View>;
}

export function LoginPrompt({ title, body }: { title: string; body: string }) {
  return <Prompt icon="user" title={title} body={body} action="Log in" onAction={() => router.push('/login')} />;
}

