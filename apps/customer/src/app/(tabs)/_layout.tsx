import { Easing } from 'react-native';
import { Tabs } from 'expo-router';
import { Navigation } from '@/components/navigation';
import { colors } from '@/theme';

export default function TabsLayout() {
  return <Tabs tabBar={(props) => <Navigation {...props} />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: colors.white },
    // Old screen slides away and fades while the new one slides in, at the reference's pace.
    transitionSpec: { animation: 'timing', config: { duration: 340, easing: Easing.bezier(0.4, 0, 0.2, 1) } } }}>
    <Tabs.Screen name="index" options={{ title: 'Explore' }} />
    <Tabs.Screen name="deals" options={{ title: 'Offers' }} />
    <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
  </Tabs>;
}

