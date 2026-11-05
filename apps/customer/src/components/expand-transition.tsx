import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Rect = { x: number; y: number; width: number; height: number };
type Expansion = { source: ImageSource; from: Rect; id: number };

// Returns false when motion is reduced, so the caller simply navigates.
const ExpandContext = createContext<(source: ImageSource, from: Rect) => boolean>(() => false);
export const useExpand = () => use(ExpandContext);

const growMs = 460;

// A card's photo lifts out of the list and grows into the stay page's photo at the top of
// the screen, then hands over to the real page underneath.
export function ExpandProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [expansion, setExpansion] = useState<Expansion | null>(null);
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  const expand = useCallback((source: ImageSource, from: Rect) => {
    if (reduceMotion) return false;
    setExpansion({ source, from, id: Date.now() });
    return true;
  }, [reduceMotion]);

  useEffect(() => {
    if (!expansion) return;
    progress.set(0);
    opacity.set(1);
    progress.set(withTiming(1, { duration: growMs, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
    opacity.set(withDelay(growMs + 60, withTiming(0, { duration: 180 })));
    const timer = setTimeout(() => setExpansion(null), growMs + 300);
    return () => clearTimeout(timer);
  }, [expansion, progress, opacity]);

  const to = { width, height: width * 0.92 + insets.top };
  const from = expansion?.from ?? { x: 0, y: 0, width: 0, height: 0 };
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      left: from.x * (1 - p), top: from.y * (1 - p),
      width: from.width + (to.width - from.width) * p, height: from.height + (to.height - from.height) * p,
      borderRadius: 18 * (1 - p), opacity: opacity.get(),
    };
  });

  return <ExpandContext value={expand}>
    {children}
    {expansion ? <Animated.View key={expansion.id} pointerEvents="none" style={[{ position: 'absolute', overflow: 'hidden', zIndex: 50 }, style]}>
      <Image source={expansion.source} contentFit="cover" cachePolicy="memory-disk" style={{ width: '100%', height: '100%' }} accessible={false} />
    </Animated.View> : null}
  </ExpandContext>;
}
