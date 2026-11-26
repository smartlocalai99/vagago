import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icon';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui';
import { useAccount } from '@/state/account-context';
import { colors, fonts } from '@/theme';

const field = { minHeight: 56, borderWidth: 1, borderColor: colors.stone, borderRadius: 14, paddingHorizontal: 16, fontFamily: fonts.medium, fontSize: 17, color: colors.ink } as const;
const cleanMobile = (value: string) => value.replace(/[\s-]/g, '');

// Mobile number first. A number saved on this phone logs in with Face ID, fingerprint or the
// screen lock; a new number asks for a name and signs up.
export default function Login() {
  const { saved, canLock, isSavedNumber, logInSaved, signUp } = useAccount();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'mobile' | 'name'>('mobile');
  const [mobile, setMobile] = useState(saved?.mobile ?? '');
  const [name, setName] = useState('');
  const [lock, setLock] = useState(canLock);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameInput = useRef<TextInput>(null);

  const finish = () => (next === 'review' ? router.replace('/review') : router.back());

  const continueWithMobile = async () => {
    if (!/^[6-9]\d{9}$/.test(cleanMobile(mobile))) return setError('Enter a valid 10-digit Indian mobile number.');
    setError(null);
    if (isSavedNumber(mobile)) {
      setBusy(true);
      const problem = await logInSaved();
      setBusy(false);
      return problem ? setError(problem) : finish();
    }
    setStep('name');
  };

  const createAccount = async () => {
    setBusy(true);
    setError(null);
    const problem = await signUp({ name, mobile, lock: canLock && lock });
    setBusy(false);
    if (problem) setError(problem);
    else finish();
  };

  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.white }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingTop: 22, gap: 22, paddingBottom: 24 + insets.bottom }}>
      {step === 'mobile' ? <View key="mobile" style={{ gap: 22 }}>
        <Reveal style={{ gap: 6 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 27, color: colors.ink, letterSpacing: -0.5 }}>{saved ? `Welcome back, ${saved.name.split(' ')[0]}` : 'Log in or sign up'}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.fern }}>{saved ? 'Confirm your number and unlock with Face ID, fingerprint or your screen lock.' : 'Enter your mobile number to continue.'}</Text>
        </Reveal>
        <Reveal delay={80}>
          <View style={[field, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 }]}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, paddingHorizontal: 16 }}>+91</Text>
            <View style={{ width: 1, height: 26, backgroundColor: colors.stone }} />
            <TextInput value={mobile} onChangeText={(value) => { setMobile(value); setError(null); }} placeholder="10-digit mobile number" placeholderTextColor={colors.fern}
              keyboardType="phone-pad" autoComplete="tel-national" autoFocus={!saved} maxLength={12} returnKeyType="next" onSubmitEditing={() => void continueWithMobile()}
              accessibilityLabel="Mobile number" style={{ flex: 1, minHeight: 54, paddingHorizontal: 14, fontFamily: fonts.semibold, fontSize: 18, letterSpacing: 0.5, color: colors.ink }} />
          </View>
        </Reveal>
        {error ? <Text accessibilityRole="alert" style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.error }}>{error}</Text> : null}
        <Reveal delay={160} style={{ gap: 12 }}>
          <Button label={busy ? 'Checking…' : 'Continue'} icon={busy ? null : 'arrow'} disabled={busy} onPress={() => void continueWithMobile()} />
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, color: colors.fern, textAlign: 'center' }}>By continuing you agree to the VagaGo Terms of use and Privacy policy, available in Profile.</Text>
        </Reveal>
      </View> : <View key="name" style={{ gap: 22 }}>
        <Reveal from="right" style={{ gap: 6 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Change mobile number" onPress={() => { setStep('mobile'); setError(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 }}>
            <Icon name="back" size={16} color={colors.pine} /><Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.pine }}>+91 {cleanMobile(mobile)}</Text>
          </Pressable>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 27, color: colors.ink, letterSpacing: -0.5 }}>Nice to meet you</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.fern }}>New to VagaGo. Tell us your name to create your account.</Text>
        </Reveal>
        <Reveal from="right" delay={70}>
          <TextInput ref={nameInput} value={name} onChangeText={(value) => { setName(value); setError(null); }} placeholder="Full name, as on your ID" placeholderTextColor={colors.fern}
            autoComplete="name" autoCapitalize="words" autoFocus maxLength={100} returnKeyType="done" accessibilityLabel="Full name" style={field} />
        </Reveal>
        {canLock ? <Reveal from="right" delay={140}>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: lock }} onPress={() => setLock(!lock)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: lock ? colors.meadow : colors.canvas, borderWidth: 1, borderColor: lock ? colors.pine : colors.stone }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={21} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }}>Log in with Face ID or screen lock</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.fern }}>Next time, enter your number and unlock with your face, fingerprint or passcode.</Text>
            </View>
            <Switch value={lock} onValueChange={setLock} trackColor={{ true: colors.pine, false: colors.stone }} />
          </Pressable>
        </Reveal> : null}
        {error ? <Text accessibilityRole="alert" style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.error }}>{error}</Text> : null}
        <Reveal from="right" delay={210}><Button label={busy ? 'Creating account…' : 'Create account'} icon={busy ? null : 'check'} disabled={busy} onPress={() => void createAccount()} /></Reveal>
      </View>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
