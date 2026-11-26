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

export default function Login() {
  const { login, canLock } = useAccount();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [lock, setLock] = useState(canLock);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mobileInput = useRef<TextInput>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const problem = await login({ name, mobile, lock: canLock && lock });
    setBusy(false);
    if (problem) setError(problem);
    else router.back();
  };

  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.white }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, paddingTop: 18, gap: 22, paddingBottom: 24 + insets.bottom }}>
      <Reveal style={{ gap: 6 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: colors.ink, letterSpacing: -0.5 }}>Welcome to VagaGo</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.fern }}>Save your details once. You stay logged in on this phone until you log out.</Text>
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
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.ink }}>Face ID or screen lock</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.fern }}>Keep your profile and bookings private on this phone.</Text>
          </View>
          <Switch value={lock} onValueChange={setLock} trackColor={{ true: colors.pine, false: colors.stone }} />
        </Pressable>
      </Reveal> : null}
      {error ? <Text accessibilityRole="alert" style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.error }}>{error}</Text> : null}
      <Reveal delay={280}><Button label={busy ? 'Logging in…' : 'Log in'} icon={busy ? null : 'arrow'} disabled={busy} onPress={() => void submit()} /></Reveal>
    </ScrollView>
  </KeyboardAvoidingView>;
}
