import AsyncStorage from '@react-native-async-storage/async-storage';

type Entry<T> = { savedAt: number; value: T };

export async function readCache<T>(key: string): Promise<Entry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) as Entry<T> : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T) {
  void AsyncStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), value })).catch(() => undefined);
}
