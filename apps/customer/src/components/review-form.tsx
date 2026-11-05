import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/state/bookings-context';
import { colors, fonts } from '@/theme';

const categories = [
  { key: 'accommodation_rating', label: 'Accommodation' },
  { key: 'connectivity_rating', label: 'Connectivity' },
  { key: 'cleanliness_rating', label: 'Cleanliness' },
] as const;
type Scores = Record<(typeof categories)[number]['key'], number>;
const gold = '#E9A23B';
const input = { borderWidth: 1, borderColor: colors.stone, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.regular, fontSize: 15, color: colors.ink } as const;

// Guests rate a completed stay; it appears on the website after an admin checks it.
export function ReviewForm({ booking }: { booking: Booking }) {
  const [existing, setExisting] = useState<{ status: string } | null | undefined>(undefined);
  const [scores, setScores] = useState<Scores>({ accommodation_rating: 0, connectivity_rating: 0, cleanliness_rating: 0 });
  const [comment, setComment] = useState('');
  const [name, setName] = useState(booking.guest.fullName.split(' ')[0] ?? '');
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.from('reviews').select('status').eq('reservation_id', booking.id).maybeSingle().then(({ data }) => setExisting(data ?? null));
  }, [booking.id]);

  const submit = async () => {
    if (Object.values(scores).some((score) => score === 0)) return setFailure('Rate all three to send your review.');
    if (comment.trim().length < 10) return setFailure('Write a few words about your stay.');
    if (!name.trim()) return setFailure('Add the name to show with your review.');
    setBusy(true);
    setFailure(null);
    const { data: session } = await supabase.auth.getSession();
    const values = Object.values(scores);
    const { error } = await supabase.from('reviews').insert({
      reservation_id: booking.id, property_id: booking.stayId, customer_id: session.session?.user.id ?? '',
      rating: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), comment: comment.trim(), author_name: name.trim(), ...scores,
    });
    setBusy(false);
    if (error) setFailure('Couldn’t send your review. Please try again.');
    else setExisting({ status: 'pending' });
  };

  if (existing === undefined) return null;
  if (existing) return <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.softSave, borderRadius: 14, padding: 14 }}>
    <Icon name="check" size={18} color={colors.save} />
    <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.save }}>{existing.status === 'published' ? 'Thanks for your review. It’s live on VagaGo.' : 'Thanks for your review. It appears on VagaGo once our team has checked it.'}</Text>
  </View>;

  return <View style={{ gap: 12, borderWidth: 1, borderColor: colors.stone, borderRadius: 16, padding: 16 }}>
    <View style={{ gap: 2 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.ink }}>Rate your stay</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.fern }}>Shown on VagaGo with your first name.</Text>
    </View>
    {categories.map((item) => <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.ink }}>{item.label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={item.label} style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((star) => <Pressable key={star} accessibilityRole="radio" accessibilityState={{ checked: scores[item.key] === star }} accessibilityLabel={`${star} out of 5`}
          onPress={() => setScores((current) => ({ ...current, [item.key]: star }))} hitSlop={4} style={{ padding: 4 }}>
          <Icon name="star" size={24} color={star <= scores[item.key] ? gold : '#C2C9C6'} filled={star <= scores[item.key]} />
        </Pressable>)}
      </View>
    </View>)}
    <TextInput value={comment} onChangeText={setComment} multiline maxLength={600} placeholder="What did you enjoy? Anything others should know?" placeholderTextColor={colors.fern}
      accessibilityLabel="Your review" style={[input, { minHeight: 88, textAlignVertical: 'top' }]} />
    <TextInput value={name} onChangeText={setName} maxLength={60} placeholder="Name to show" placeholderTextColor={colors.fern} accessibilityLabel="Name to show" style={input} />
    {failure ? <Text accessibilityRole="alert" style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.error }}>{failure}</Text> : null}
    <Button label={busy ? 'Sending…' : 'Send review'} onPress={() => void submit()} disabled={busy} />
  </View>;
}
