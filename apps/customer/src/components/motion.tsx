import { useEffect, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useLaunched } from '@/state/launch-context';

// One spring for everything that settles into place, so the app moves as one system.
export const settle = { damping: 18, stiffness: 150, mass: 0.9 };
const press = { damping: 16, stiffness: 320, mass: 0.6 };

type RevealProps = { children: ReactNode; delay?: number; from?: 'below' | 'right' | 'small'; style?: StyleProp<ViewStyle> };

// Fades a block in while it rises (or slides in from the right, or grows) into place.
// On the first screen it waits until the launch animation has finished.
export function Reveal({ children, delay = 0, from = 'below', style }: RevealProps) {
  const launched = useLaunched();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (launched) progress.set(withDelay(delay, withSpring(1, settle)));
  }, [launched, delay, progress]);
  const animated = useAnimatedStyle(() => {
    const value = progress.get();
    const opacity = interpolate(value, [0, 0.7], [0, 1], Extrapolation.CLAMP);
    if (from === 'right') return { opacity, transform: [{ translateX: 70 * (1 - value) }] };
    if (from === 'small') return { opacity, transform: [{ scale: 0.82 + 0.18 * value }] };
    return { opacity, transform: [{ translateY: 26 * (1 - value) }] };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Shrinks slightly under the finger and springs back, like the cards in the reference.
export function PressScale({ children, style, scaleTo = 0.96, onPressIn, onPressOut, ...props }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number; children: ReactNode }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <AnimatedPressable {...props}
    onPressIn={(event) => { scale.set(withSpring(scaleTo, press)); onPressIn?.(event); }}
    onPressOut={(event) => { scale.set(withSpring(1, press)); onPressOut?.(event); }}
    style={[style, animated]}>{children}</AnimatedPressable>;
}
