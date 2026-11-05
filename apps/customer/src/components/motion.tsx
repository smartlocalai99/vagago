import { createContext, use, useEffect, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useLaunched } from '@/state/launch-context';

// One smooth deceleration for everything (as in the reference): no springs, so nothing overshoots.
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const swap = Easing.bezier(0.4, 0, 0.2, 1);

type RevealProps = { children: ReactNode; delay?: number; duration?: number; from?: 'below' | 'right' | 'fade' | 'grow' | 'zoom'; style?: StyleProp<ViewStyle> };

// Brings a block into place. On the first screen it waits until the launch animation has finished.
// zoom: the whole screen grows from the distance; grow: a photo scales up into place.
export function Reveal({ children, delay = 0, duration = 520, from = 'below', style }: RevealProps) {
  const launched = useLaunched();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (launched) progress.set(withDelay(delay, withTiming(1, { duration, easing: ease })));
  }, [launched, delay, duration, progress]);
  const animated = useAnimatedStyle(() => {
    const value = progress.get();
    const opacity = interpolate(value, [0, 0.6], [0, 1], Extrapolation.CLAMP);
    if (from === 'right') return { opacity, transform: [{ translateX: 90 * (1 - value) }] };
    if (from === 'fade') return { opacity, transform: [{ scale: 0.92 + 0.08 * value }] };
    if (from === 'grow') return { opacity, transform: [{ scale: 0.9 + 0.1 * value }] };
    if (from === 'zoom') return { opacity: interpolate(value, [0, 0.45], [0, 1], Extrapolation.CLAMP), transform: [{ scale: 0.7 + 0.3 * value }] };
    return { opacity, transform: [{ translateY: 24 * (1 - value) }] };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Shrinks while held and eases back on release, like the cards in the reference.
export function PressScale({ children, style, scaleTo = 0.94, onPressIn, onPressOut, ...props }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number; children: ReactNode }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <AnimatedPressable {...props}
    onPressIn={(event) => { scale.set(withTiming(scaleTo, { duration: 140, easing: Easing.out(Easing.quad) })); onPressIn?.(event); }}
    onPressOut={(event) => { scale.set(withTiming(1, { duration: 260, easing: ease })); onPressOut?.(event); }}
    style={[style, animated]}>{children}</AnimatedPressable>;
}

// Explore slides slightly left as a stay page fades in over it, and back when you return.
export const LeaveListContext = createContext<() => void>(() => undefined);
export const useLeaveList = () => use(LeaveListContext);
