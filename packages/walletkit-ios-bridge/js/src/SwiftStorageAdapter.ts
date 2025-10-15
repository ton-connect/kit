import { StorageAdapter } from '@ton/walletkit';

/**
 * In-memory storage adapter for testing and temporary storage
 */
export class SwiftStorageAdapter implements StorageAdapter {
    private swiftStorage: StorageAdapter;

    constructor(swiftStorage: StorageAdapter) {
        this.swiftStorage = swiftStorage;
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.swiftStorage.get<string>(key);
        return value ? JSON.parse(value) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await this.swiftStorage.set(key, JSON.stringify(value));
    }

    async remove(key: string): Promise<void> {
        await this.swiftStorage.remove(key);
    }

    async clear(): Promise<void> {
        await this.swiftStorage.clear();
    }
}
