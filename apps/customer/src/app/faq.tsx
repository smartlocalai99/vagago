import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Faq } from '@/components/explore-sections';
import { colors } from '@/theme';

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  return <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 + insets.bottom }}>
    <Faq title={false} />
  </ScrollView>;
}
