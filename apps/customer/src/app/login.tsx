import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icon';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui';
import { useAccount } from '@/state/account-context';
import { colors, fonts } from '@/theme';

const field = { minHeight: 54, borderWidth: 1, borderColor: colors.stone, borderRadius: 14, paddingHorizontal: 16, fontFamily: fonts.medium, fontSize: 16, color: colors.ink } as const;

// Returning guest who logged out with Face ID / screen lock: one tap to log back in.
function WelcomeBack() {
  const { saved, logInWithLock, forgetSaved } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!saved) return null;
  const initials = saved.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const go = async () => {
    setBusy(true);
    setError(null);
    const problem = await logInWithLock();
    setBusy(false);
    if (problem) setError(problem);
    else router.back();
  };
  return <View style={{ alignItems: 'center', gap: 16, paddingTop: 30 }}>
    <Reveal from="grow"><View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: colors.white }}>{initials}</Text>
    </View></Reveal>
    <Reveal delay={70} style={{ alignItems: 'center', gap: 4 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.ink }}>Welcome back, {saved.name.split(' ')[0]}</Text>
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.fern }}>+91 {saved.mobile.replace(/(\d{5})(\d{5})/, '$1 $2')}</Text>
    </Reveal>
    {error ? <Text accessibilityRole="alert" style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.error }}>{error}</Text> : null}
    <Reveal delay={140} style={{ alignSelf: 'stretch', gap: 6 }}>
      <Button label={busy ? 'Checking…' : 'Log in with Face ID or screen lock'} icon={busy ? null : 'lock'} disabled={busy} onPress={() => void go()} />
      <Pressable accessibilityRole="button" onPress={() => void forgetSaved()} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.pine, textDecorationLine: 'underline' }}>Use a different name or number</Text>
      </Pressable>
    </Reveal>
  </View>;
}

function SignUp() {
  const { signUp, canLock } = useAccount();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [lock, setLock] = useState(canLock);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mobileInput = useRef<TextInput>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const problem = await signUp({ name, mobile, lock: canLock && lock });
    setBusy(false);
    if (problem) setError(problem);
    else router.back();
  };

  return <>
    <Reveal style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: colors.ink, letterSpacing: -0.5 }}>Welcome to VagaGo</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.fern }}>Sign up once. You stay logged in on this phone until you log out.</Text>
    </Reveal>
    <Reveal delay={70} style={{ gap: 7 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.ink }}>Full name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Name as on your ID" placeholderTextColor={colors.fern} autoComplete="name" autoCapitalize="words"
        maxLength={100} returnKeyType="next" onSubmitEditing={() => mobileInput.current?.focus()} accessibilityLabel="Full name" style={field} />
    </Reveal>
    <Reveal delay={140} style={{ gap: 7 }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.ink }}>Mobile number</Text>
      <View style={[field, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 }]}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, paddingHorizontal: 16 }}>+91</Text>
        <View style={{ width: 1, height: 24, backgroundColor: colors.stone }} />
        <TextInput ref={mobileInput} value={mobile} onChangeText={setMobile} placeholder="10-digit mobile number" placeholderTextColor={colors.fern} keyboardType="phone-pad"
          autoComplete="tel-national" maxLength={12} accessibilityLabel="Mobile number" style={{ flex: 1, minHeight: 52, paddingHorizontal: 14, fontFamily: fonts.medium, fontSize: 16, color: colors.ink }} />
      </View>
    </Reveal>
    {canLock ? <Reveal delay={210}>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: lock }} onPress={() => setLock(!lock)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: lock ? colors.meadow : colors.canvas, borderWidth: 1, borderColor: lock ? colors.pine : colors.stone }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={21} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }}>Log in with Face ID or screen lock</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.fern }}>After you log out, log back in with your face, fingerprint or passcode instead of typing your details.</Text>
        </View>
        <Switch value={lock} onValueChange={setLock} trackColor={{ true: colors.pine, false: colors.stone }} />
      </Pressable>
    </Reveal> : null}
    {error ? <Text accessibilityRole="alert" style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.error }}>{error}</Text> : null}
    <Reveal delay={280} style={{ gap: 10 }}>
      <Button label={busy ? 'Signing up…' : 'Sign up'} icon={busy ? null : 'arrow'} disabled={busy} onPress={() => void submit()} />
      <Text style={{ fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.fern, textAlign: 'center' }}>By signing up you agree to the VagaGo Terms of use and Privacy policy, available in Profile.</Text>
    </Reveal>
  </>;
}

export default function Login() {
  const { saved } = useAccount();
  const insets = useSafeAreaInsets();
  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.white }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingTop: 18, gap: 22, paddingBottom: 24 + insets.bottom }}>
      {saved ? <WelcomeBack /> : <SignUp />}
    </ScrollView>
  </KeyboardAvoidingView>;
}
