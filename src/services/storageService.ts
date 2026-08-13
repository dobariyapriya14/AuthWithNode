import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const storageService = {
  get: (key: string) => storage.getString(key),
  set: (key: string, value: string) => storage.set(key, value),
  remove: (key: string) => {
    if (storage.contains(key)) {
      storage.remove(key);
    }
  },

  // Token helper utilities
  getAccessToken: () => storage.getString('accessToken'),
  getRefreshToken: () => storage.getString('refreshToken'),
  setTokens: (accessToken: string, refreshToken?: string) => {
    storage.set('accessToken', accessToken);
    if (refreshToken) {
      storage.set('refreshToken', refreshToken);
    }
  },
  clearTokens: () => {
    if (storage.contains('accessToken')) storage.remove('accessToken');
    if (storage.contains('refreshToken')) storage.remove('refreshToken');
  },
};
