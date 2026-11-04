import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

const logo = require('../../assets/brand-logo.jpeg');
const brandGreen = '#073728';

export function BrandMark({ size = 44, onLoadEnd }: { size?: number; onLoadEnd?: () => void }) {
  const markWidth = size * 0.9;
  const scale = markWidth / 550;
  return <View accessible accessibilityRole="image" accessibilityLabel="VagaGo"
    style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: brandGreen,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <View style={{ width: markWidth, height: 405 * scale, overflow: 'hidden' }}>
      <Image source={logo} accessible={false} onLoadEnd={onLoadEnd} contentFit="contain"
        style={{ position: 'absolute', width: 1254 * scale, height: 1254 * scale, left: -350 * scale, top: -335 * scale }} />
    </View>
  </View>;
}

export function LaunchScreen({ ready, onComplete }: { ready: boolean; onComplete: () => void }) {
  const [imageReady, setImageReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.2);
  const scale = useSharedValue(0.92);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scale: scale.get() }] }));

  useEffect(() => {
    if (!ready || !imageReady) return;
    if (process.env.EXPO_OS !== 'web') void SplashScreen.hideAsync().catch(() => undefined);
    if (reduceMotion) {
      opacity.set(1);
      scale.set(1);
      onComplete();
      return;
    }
    opacity.set(withTiming(1, { duration: 420 }));
    scale.set(withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) }));
    const timer = setTimeout(onComplete, 650);
    return () => clearTimeout(timer);
  }, [ready, imageReady, reduceMotion, opacity, scale, onComplete]);

  return <View accessibilityLabel="Opening VagaGo" style={{ flex: 1, backgroundColor: brandGreen, justifyContent: 'center', alignItems: 'center' }}>
    <Animated.View style={animatedStyle}><BrandMark size={154} onLoadEnd={() => setImageReady(true)} /></Animated.View>
  </View>;
}
