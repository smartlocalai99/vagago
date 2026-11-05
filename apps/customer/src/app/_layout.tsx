import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router/stack';
import { router } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EscapeProvider, useEscape } from '@/state/escape-context';
import { LocationProvider, useLocationContext } from '@/state/location-context';
import { BookingsProvider, useBookings } from '@/state/bookings-context';
import { CatalogProvider, useCatalog } from '@/state/catalog-context';
import { LaunchContext } from '@/state/launch-context';
import { brandGreen, LaunchScreen } from '@/components/launch-screen';
import { Icon } from '@/components/icon';
import { ExpandProvider } from '@/components/expand-transition';
import { colors, fonts } from '@/theme';

if (process.env.EXPO_OS !== 'web') void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppStack({ fontsReady }: { fontsReady: boolean }) {
  const { ready, storageError, dismissStorageError } = useEscape();
  const { ready: locationReady, promptSeen } = useLocationContext();
  const { ready: bookingsReady } = useBookings();
  const { ready: catalogReady } = useCatalog();
  const [launched, setLaunched] = useState(false);
  const finishLaunch = useCallback(() => setLaunched(true), []);
  const allReady = fontsReady && ready && locationReady && bookingsReady && catalogReady;
  // The app mounts underneath the launch screen as soon as data is ready, so the launch
  // animation fades straight into the first screen.
  return <View style={{ flex: 1, backgroundColor: launched ? colors.white : brandGreen }}>
    <StatusBar style={launched ? 'dark' : 'light'} />
    {allReady ? <LaunchContext value={launched}><AppScreens promptSeen={promptSeen} storageError={storageError} dismissStorageError={dismissStorageError} /></LaunchContext> : null}
    {!launched ? <LaunchScreen ready={allReady} onComplete={finishLaunch} /> : null}
  </View>;
}

function AppScreens({ promptSeen, storageError, dismissStorageError }: { promptSeen: boolean; storageError: string | null; dismissStorageError: () => void }) {
  return <ExpandProvider><View style={{ flex: 1, backgroundColor: colors.white }}>
    {storageError ? <Pressable accessibilityRole="button" accessibilityLabel="Dismiss storage warning" onPress={dismissStorageError} style={{ padding: 16, paddingTop: 48, backgroundColor: colors.softError }}><Text accessibilityRole="alert" style={{ fontFamily: fonts.medium, color: colors.error }}>{storageError} Tap to dismiss.</Text></Pressable> : null}
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.white }, headerTintColor: colors.ink, headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.white }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={promptSeen}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="stay/[id]" options={{ headerShown: false, animation: 'fade', animationDuration: 280 }} />
        <Stack.Screen name="search" options={{ title: 'Search stays', presentation: 'modal', headerLeft: () => <Pressable accessibilityRole="button" accessibilityLabel="Close search" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}><Icon name="close" size={22} /></Pressable> }} />
        <Stack.Screen name="plan" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ title: 'Confirm your stay' }} />
        <Stack.Screen name="payment" options={{ title: 'Payment' }} />
        <Stack.Screen name="booking/[id]" options={{ title: 'Your booking' }} />
        <Stack.Screen name="faq" options={{ title: 'Questions and answers' }} />
      </Stack.Protected>
      <Stack.Screen name="location" options={{ title: 'Your location', headerBackVisible: promptSeen, gestureEnabled: promptSeen }} />
    </Stack>
  </View></ExpandProvider>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_400Regular: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
    Manrope_500Medium: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
    Manrope_600SemiBold: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
    Manrope_700Bold: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
  });
  return <SafeAreaProvider><View style={{ flex: 1, backgroundColor: '#E9EDEA', alignItems: 'center' }}><View style={{ flex: 1, width: '100%', maxWidth: process.env.EXPO_OS === 'web' ? 480 : undefined }}><EscapeProvider><CatalogProvider><BookingsProvider><LocationProvider><AppStack fontsReady={loaded || Boolean(error)} /></LocationProvider></BookingsProvider></CatalogProvider></EscapeProvider></View></View></SafeAreaProvider>;
}

