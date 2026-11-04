import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';

type LocationStatus = 'undetermined' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';
type ApproximateLocation = {
  latitude: number;
  longitude: number;
  distanceToVagamonKm: number;
  label: string;
};
type LocationState = {
  ready: boolean;
  promptSeen: boolean;
  status: LocationStatus;
  canAskAgain: boolean;
  location: ApproximateLocation | null;
  error: string | null;
  requestLocation: () => Promise<boolean>;
  skipPrompt: () => Promise<void>;
  openSettings: () => Promise<void>;
};

const LocationContext = createContext<LocationState | null>(null);
const promptKey = '@vagago/location-prompt:v1';
// General destination point, not a property's coordinates or a road-distance endpoint.
const vagamon = { latitude: 9.69, longitude: 76.91 };

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), milliseconds);
    operation.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

function approximateLocation(latitude: number, longitude: number): ApproximateLocation {
  const lat = Math.round(latitude * 100) / 100;
  const lon = Math.round(longitude * 100) / 100;
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLat = radians(vagamon.latitude - lat);
  const deltaLon = radians(vagamon.longitude - lon);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(vagamon.latitude)) * Math.sin(deltaLon / 2) ** 2;
  const distance = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))));
  return {
    latitude: lat,
    longitude: lon,
    distanceToVagamonKm: distance,
    label: distance < 2 ? 'Near Vagamon' : `About ${distance.toLocaleString('en-IN')} km from Vagamon`,
  };
}

async function readPermission() {
  if (process.env.EXPO_OS === 'web' && (typeof navigator === 'undefined' || !navigator.geolocation)) {
    return { status: 'unavailable' as const, canAskAgain: false };
  }
  try {
    const permission = await withTimeout(Location.getForegroundPermissionsAsync(), 2500);
    return {
      status: permission.status as 'granted' | 'denied' | 'undetermined',
      canAskAgain: process.env.EXPO_OS === 'web' && permission.status === 'denied' ? false : permission.canAskAgain,
    };
  } catch {
    // Older browsers may support geolocation without the Permissions query API.
    return { status: 'undetermined' as const, canAskAgain: true };
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [promptSeen, setPromptSeen] = useState(false);
  const [status, setStatus] = useState<LocationStatus>('undetermined');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [location, setLocation] = useState<ApproximateLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const requestId = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    async function restore() {
      const [saved, permission] = await Promise.allSettled([
        withTimeout(AsyncStorage.getItem(promptKey), 2500), readPermission(),
      ]);
      if (cancelled) return;
      if (saved.status === 'fulfilled') setPromptSeen(saved.value === '1');
      if (permission.status === 'fulfilled') {
        setStatus(permission.value.status);
        setCanAskAgain(permission.value.canAskAgain);
      }
      setReady(true);
    }
    void restore();
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state !== 'active' || busy.current) return;
      const permission = await readPermission();
      if (cancelled || busy.current) return;
      setStatus(permission.status);
      setCanAskAgain(permission.canAskAgain);
      if (permission.status !== 'granted') setLocation(null);
      if (permission.status === 'granted' || permission.status === 'undetermined') setError(null);
    });
    return () => {
      cancelled = true;
      mounted.current = false;
      requestId.current += 1;
      subscription.remove();
    };
  }, []);

  const markPromptSeen = useCallback(async () => {
    setPromptSeen(true);
    try {
      // This is the only persisted location-related value. No coordinates are stored.
      await AsyncStorage.setItem(promptKey, '1');
    } catch {
      if (mounted.current) setError('Your choice could not be saved on this device. You can still browse stays.');
    }
  }, []);

  const requestLocation = useCallback(async (): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    const currentRequest = ++requestId.current;
    const active = () => mounted.current && currentRequest === requestId.current;
    setStatus('requesting');
    setError(null);
    void markPromptSeen();
    try {
      let coordinates: { latitude: number; longitude: number };
      if (process.env.EXPO_OS === 'web') {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          setStatus('unavailable');
          setError('Location is unavailable in this browser. You can still explore Vagamon.');
          return false;
        }
        // A single browser request both prompts and reads; no watcher is installed.
        const position = await withTimeout(new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
        }), 11000);
        coordinates = position.coords;
      } else {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active()) return false;
        setCanAskAgain(permission.canAskAgain);
        if (!permission.granted) {
          setStatus('denied');
          setLocation(null);
          setError('Location access is off. You can continue browsing Vagamon stays.');
          return false;
        }
        if (!await withTimeout(Location.hasServicesEnabledAsync(), 2500)) {
          if (!active()) return false;
          setStatus('unavailable');
          setError('Device location is switched off. Turn it on in Settings or continue without it.');
          return false;
        }
        const position = await withTimeout(Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: false,
        }), 10000);
        coordinates = position.coords;
      }
      if (!active()) return false;
      if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)
        || Math.abs(coordinates.latitude) > 90 || Math.abs(coordinates.longitude) > 180) throw new Error('INVALID_LOCATION');
      setLocation(approximateLocation(coordinates.latitude, coordinates.longitude));
      setStatus('granted');
      setCanAskAgain(true);
      return true;
    } catch (cause) {
      if (!active()) return false;
      setLocation(null);
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : null;
      if (code === 1 || code === 'E_LOCATION_UNAUTHORIZED') {
        setStatus('denied');
        setCanAskAgain(false);
        setError('Location access is off. You can enable it in Settings or keep browsing.');
      } else {
        setStatus('error');
        setError('We could not find your location. Try again or continue exploring Vagamon.');
      }
      return false;
    } finally {
      if (currentRequest === requestId.current) busy.current = false;
    }
  }, [markPromptSeen]);

  const skipPrompt = useCallback(async () => {
    // Ignore a late one-time result if the customer chooses to continue without it.
    requestId.current += 1;
    busy.current = false;
    setStatus((value) => value === 'requesting' ? 'undetermined' : value);
    void markPromptSeen();
  }, [markPromptSeen]);

  const openSettings = useCallback(async () => {
    if (process.env.EXPO_OS === 'web') {
      setError('Open this site’s permissions in your browser and allow Location, then try again.');
      return;
    }
    try { await Linking.openSettings(); }
    catch { setError('Open your device Settings and allow location for VagaGo.'); }
  }, []);

  const value = useMemo(() => ({ ready, promptSeen, status, canAskAgain, location, error, requestLocation, skipPrompt, openSettings }),
    [ready, promptSeen, status, canAskAgain, location, error, requestLocation, skipPrompt, openSettings]);
  return <LocationContext value={value}>{children}</LocationContext>;
}

export function useLocationContext(): LocationState {
  const context = use(LocationContext);
  if (!context) throw new Error('useLocationContext must be used within LocationProvider.');
  return context;
}
