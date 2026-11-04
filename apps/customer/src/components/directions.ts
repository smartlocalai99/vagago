import { Linking } from 'react-native';
import type { Coordinates } from '@/types';

export function openDirections(to: Coordinates, from?: Coordinates) {
  const destination = `${to.latitude},${to.longitude}`;
  const origin = from ? `${from.latitude},${from.longitude}` : null;
  const url = process.env.EXPO_OS === 'ios'
    ? `https://maps.apple.com/?daddr=${destination}&dirflg=d${origin ? `&saddr=${origin}` : ''}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving${origin ? `&origin=${origin}` : ''}`;
  return Linking.openURL(url).catch(() => undefined);
}
