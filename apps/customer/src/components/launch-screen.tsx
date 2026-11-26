import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const logo = require('../../assets/brand-logo.jpeg');
const mark = require('../../assets/splash-mark.png');
const wordmark = require('../../assets/splash-wordmark.png');
export const brandGreen = '#073728';

// The native splash (app.json) shows splash-mark.png 120pt wide, centred. This screen starts on
// that exact frame so the hand-off is invisible, then plays one sequence and reveals the app.
const markWidth = 120;
const markHeight = markWidth * 382 / 501;
const wordWidth = markWidth * 748 / 501;
const wordHeight = wordWidth * 211 / 748;
const gap = 16;
const lift = (gap + wordHeight) / 2;
// Kept short: the app should feel instant.
const revealMs = 380;
const holdMs = 120;
const exitMs = 240;

export function BrandMark({ size = 44, onLoadEnd }: { size?: number; onLoadEnd?: () => void }) {
  const innerWidth = size * 0.9;
  const scale = innerWidth / 550;
  return <View accessible accessibilityRole="image" accessibilityLabel="VagaGo"
    style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: brandGreen,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <View style={{ width: innerWidth, height: 405 * scale, overflow: 'hidden' }}>
      <Image source={logo} accessible={false} onLoadEnd={onLoadEnd} contentFit="contain"
        style={{ position: 'absolute', width: 1254 * scale, height: 1254 * scale, left: -350 * scale, top: -335 * scale }} />
    </View>
  </View>;
}

export function LaunchScreen({ ready, onComplete }: { ready: boolean; onComplete: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const reduceMotion = useReducedMotion();
  const reveal = useSharedValue(0);
  const exit = useSharedValue(0);

  const screenStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.get() }));
  const groupStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift * reveal.get() }, { scale: 1 + 0.08 * exit.get() }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: reveal.get(), transform: [{ translateY: 10 * (1 - reveal.get()) }] }));

  useEffect(() => {
    if (!ready || loaded < 2) return;
    if (process.env.EXPO_OS !== 'web') void SplashScreen.hideAsync().catch(() => undefined);
    if (reduceMotion) {
      reveal.set(1);
      exit.set(withTiming(1, { duration: 200 }));
      const timer = setTimeout(onComplete, 220);
      return () => clearTimeout(timer);
    }
    reveal.set(withTiming(1, { duration: revealMs, easing: Easing.out(Easing.cubic) }));
    exit.set(withDelay(revealMs + holdMs, withTiming(1, { duration: exitMs, easing: Easing.in(Easing.quad) })));
    const timer = setTimeout(onComplete, revealMs + holdMs + exitMs + 20);
    return () => clearTimeout(timer);
  }, [ready, loaded, reduceMotion, reveal, exit, onComplete]);

  const onLoadEnd = () => setLoaded((count) => count + 1);
  return <Animated.View accessible accessibilityLabel="Opening VagaGo" style={[StyleSheet.absoluteFill, { backgroundColor: brandGreen, zIndex: 10 }, screenStyle]}>
    <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, groupStyle]}>
      <Image source={mark} onLoadEnd={onLoadEnd} accessible={false} contentFit="contain" style={{ width: markWidth, height: markHeight }} />
      <Animated.View style={[{ position: 'absolute', top: '50%', marginTop: markHeight / 2 + gap }, wordStyle]}>
        <Image source={wordmark} onLoadEnd={onLoadEnd} accessible={false} contentFit="contain" style={{ width: wordWidth, height: wordHeight }} />
      </Animated.View>
    </Animated.View>
  </Animated.View>;
}
