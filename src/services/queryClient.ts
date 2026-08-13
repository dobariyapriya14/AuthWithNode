import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createMMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

const storage = createMMKV();

// Setup online status listener for React Native
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Configure QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Create MMKV persister for caching query client state across reboots
export const clientPersister = createSyncStoragePersister({
  storage: {
    setItem: (key, value) => storage.set(key, value),
    getItem: (key) => storage.getString(key) ?? null,
    removeItem: (key) => storage.remove(key),
  },
});
