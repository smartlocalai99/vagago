import { Tabs } from 'expo-router';
import { Navigation } from '@/components/navigation';
import { colors } from '@/theme';

export default function TabsLayout() {
  return <Tabs tabBar={(props) => <Navigation {...props} />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: colors.white } }}>
    <Tabs.Screen name="index" options={{ title: 'Explore' }} />
    <Tabs.Screen name="deals" options={{ title: 'Offers' }} />
    <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
  </Tabs>;
}

