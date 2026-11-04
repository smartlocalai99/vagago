import { Stack, router } from 'expo-router';
import { EmptyState, Page } from '@/components/ui';

export default function NotFound() {
  return <Page>
    <Stack.Screen options={{ title: 'Not found' }} />
    <EmptyState title="This screen isn’t available" body="Return to Explore to find stays in Vagamon." action="Explore stays" onAction={() => router.replace('/')} icon="search" />
  </Page>;
}
