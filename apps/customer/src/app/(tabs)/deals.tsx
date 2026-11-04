import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, EmptyState, Heading, Page, StayCard } from '@/components/ui';
import { getPublishedHotDeals } from '@/data/hot-deals';
import { useStays } from '@/state/catalog-context';
import { colors, fonts } from '@/theme';

export default function Offers() {
  const stays = useStays();
  const offers = getPublishedHotDeals().flatMap((deal) => {
    const stay = stays.find((item) => item.id === deal.stayId);
    return stay ? [{ deal, stay }] : [];
  });
  return <Page tabs>
    <View style={{ gap: 4 }}>
      <Heading size={24}>Offers</Heading>
      <AppText style={{ color: colors.fern, fontSize: 13 }}>Limited-time prices on stays in Vagamon.</AppText>
    </View>
    {offers.length ? <View style={{ gap: 28, marginHorizontal: -20 }}>{offers.map(({ deal, stay }) => <View key={deal.id} style={{ gap: 10 }}>
      <View style={{ paddingHorizontal: 20, gap: 3 }}>
        <AppText style={{ fontFamily: fonts.bold, color: colors.deal }}>{deal.title}</AppText>
        <AppText style={{ fontSize: 12, color: colors.fern }}>{deal.description}</AppText>
      </View>
      <StayCard stay={stay} />
    </View>)}</View>
      : <EmptyState icon="tag" title="No offers right now" body="New offers will appear here when properties publish them." action="Explore stays" onAction={() => router.navigate('/')} />}
  </Page>;
}
