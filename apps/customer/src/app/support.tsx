import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icon';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAccount } from '@/state/account-context';
import { colors, fonts } from '@/theme';

const field = { borderWidth: 1, borderColor: colors.stone, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.regular, fontSize: 15, color: colors.ink } as const;

// Messages go to the VagaGo team (support_requests), who reply by phone or email.
export default function Support() {
  const { account } = useAccount();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(account?.name ?? '');
  const [contact, setContact] = useState(account ? `+91 ${account.mobile}` : '');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (name.trim().length < 2) return setError('Enter your name.');
    if (contact.trim().length < 5) return setError('Enter a phone number or email we can reply to.');
    if (message.trim().length < 10) return setError('Tell us a little more so we can help.');
    setState('sending');
    setError(null);
    const { data } = await supabase.auth.getSession();
    const { error: insertError } = await supabase.from('support_requests').insert({ user_id: data.session?.user.id ?? null, name: name.trim(), contact: contact.trim(), message: message.trim(), source: 'app' });
    if (insertError) { setState('idle'); setError('Couldn’t send your message. Check your connection and try again.'); }
    else setState('sent');
  };

  if (state === 'sent') return <View style={{ flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
    <Reveal from="grow"><View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.softOk, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={34} color={colors.ok} /></View></Reveal>
    <Reveal delay={80} style={{ alignItems: 'center', gap: 6 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 21, color: colors.ink }}>Message sent</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.fern, textAlign: 'center' }}>Thanks for writing. We’ll get back to you at {contact.trim()}.</Text>
    </Reveal>
    <Reveal delay={160} style={{ alignSelf: 'stretch' }}><Button label="Done" onPress={() => router.back()} /></Reveal>
  </View>;

  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.white }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 + insets.bottom }}>
      <Reveal><Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.fern }}>Questions about a booking, a stay or your account? Send us a message and we’ll reply by phone or email.</Text></Reveal>
      <Reveal delay={60}><TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.fern} accessibilityLabel="Your name" maxLength={100} style={field} /></Reveal>
      <Reveal delay={120}><TextInput value={contact} onChangeText={setContact} placeholder="Phone number or email" placeholderTextColor={colors.fern} accessibilityLabel="Phone number or email" autoCapitalize="none" maxLength={254} style={field} /></Reveal>
      <Reveal delay={180}><TextInput value={message} onChangeText={setMessage} placeholder="How can we help?" placeholderTextColor={colors.fern} accessibilityLabel="Your message" multiline maxLength={2000} style={[field, { minHeight: 140, textAlignVertical: 'top' }]} /></Reveal>
      {error ? <Text accessibilityRole="alert" style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.error }}>{error}</Text> : null}
      <Reveal delay={240}><Button label={state === 'sending' ? 'Sending…' : 'Send message'} icon={state === 'sending' ? null : 'arrow'} disabled={state === 'sending'} onPress={() => void send()} /></Reveal>
    </ScrollView>
  </KeyboardAvoidingView>;
}
