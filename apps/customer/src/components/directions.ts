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

// Before booking only the neighbourhood is shown: the position is rounded to about 1 km.
export function openArea(at: Coordinates, label: string) {
  const ll = `${at.latitude.toFixed(2)},${at.longitude.toFixed(2)}`;
  const url = process.env.EXPO_OS === 'ios'
    ? `https://maps.apple.com/?ll=${ll}&q=${encodeURIComponent(label)}&z=13`
    : `https://www.google.com/maps/search/?api=1&query=${ll}`;
  return Linking.openURL(url).catch(() => undefined);
}
