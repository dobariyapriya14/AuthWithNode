import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const storageService = {
  get: (key: string) => storage.getString(key),
  set: (key: string, value: string) => storage.set(key, value),
  remove: (key: string) => (storage as any).delete ? (storage as any).delete(key) : (storage as any).remove(key),
};
