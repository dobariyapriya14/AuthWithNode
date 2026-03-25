import { createMMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import apiService from './apiService';

const storage = createMMKV();

const KEYS = {
    TODOS_CACHE: 'todos_cache',
    PENDING_MUTATIONS: 'pending_mutations',
};

interface PendingMutation {
    id: string; // Internal unique ID for the mutation
    type: 'ADD' | 'UPDATE' | 'DELETE';
    data?: any;
    targetId?: string; // The ID of the todo being updated or deleted
    timestamp: number;
}

class OfflineService {
    private isSyncing = false;

    // --- Cache Management ---

    getTodosCache(): any[] {
        const cached = storage.getString(KEYS.TODOS_CACHE);
        return cached ? JSON.parse(cached) : [];
    }

    setTodosCache(todos: any[]) {
        storage.set(KEYS.TODOS_CACHE, JSON.stringify(todos));
    }

    // --- Queue Management ---

    getPendingMutations(): PendingMutation[] {
        const mutations = storage.getString(KEYS.PENDING_MUTATIONS);
        return mutations ? JSON.parse(mutations) : [];
    }

    addMutationToQueue(mutation: Omit<PendingMutation, 'id' | 'timestamp'>) {
        const queue = this.getPendingMutations();
        const newMutation: PendingMutation = {
            ...mutation,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
        };
        queue.push(newMutation);
        storage.set(KEYS.PENDING_MUTATIONS, JSON.stringify(queue));
        console.log("Mutation added to queue:", newMutation.type);
    }

    removeMutationFromQueue(id: string) {
        const queue = this.getPendingMutations();
        const updatedQueue = queue.filter(m => m.id !== id);
        storage.set(KEYS.PENDING_MUTATIONS, JSON.stringify(updatedQueue));
    }

    // --- Sync Logic ---

    async syncPendingMutations() {
        if (this.isSyncing) return;

        const state = await NetInfo.fetch();
        if (!state.isConnected) return;

        const queue = this.getPendingMutations();
        if (queue.length === 0) return;

        this.isSyncing = true;
        console.log(`Starting sync for ${queue.length} mutations...`);

        // Sort by timestamp to ensure chronological order
        const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);

        for (const mutation of sortedQueue) {
            try {
                if (mutation.type === 'ADD') {
                    // Note: In a real app, you might need to handle multipart/form-data here if you stored it that way
                    // For simplicity, we assume 'data' is compatible or we store minimal info
                    await apiService.saveTodo(mutation.data);
                } else if (mutation.type === 'UPDATE') {
                    await apiService.saveTodo(mutation.data, mutation.targetId);
                } else if (mutation.type === 'DELETE') {
                    if (mutation.targetId) {
                        await apiService.deleteTodo(mutation.targetId);
                    }
                }
                this.removeMutationFromQueue(mutation.id);
                console.log(`Synced mutation: ${mutation.type}`);
            } catch (error) {
                console.error(`Failed to sync mutation ${mutation.id}:`, error);
                // If it's a permanent error (e.g. 404), maybe remove it? 
                // For now, we stop sync to avoid breaking sequence
                break;
            }
        }

        this.isSyncing = false;
    }
}

export default new OfflineService();
