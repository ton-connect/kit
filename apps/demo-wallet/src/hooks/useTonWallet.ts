import { useEffect, useState, useCallback } from 'react';
import { mnemonicNew } from '@ton/crypto';

import { useWalletStore, useAuthStore } from '../stores';

// Mock TON Kit type for demo purposes
interface MockTonKit {
    initialized: boolean;
}

interface UseTonWalletReturn {
    tonKit: MockTonKit | null;
    isInitialized: boolean;
    error: string | null;
    initializeWallet: () => Promise<void>;
    createNewWallet: () => Promise<string[]>;
    importWallet: (mnemonic: string[]) => Promise<void>;
    getBalance: () => Promise<string>;
    sendTransaction: (to: string, amount: string) => Promise<void>;
}

export const useTonWallet = (): UseTonWalletReturn => {
    const [tonKit, setTonKit] = useState<MockTonKit | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const walletStore = useWalletStore();
    const authStore = useAuthStore();

    const initializeWallet = useCallback(async () => {
        try {
            setError(null);

            // Mock TON Kit initialization
            const kit = {
                // Mock implementation for demo purposes
                initialized: true,
            };

            setTonKit(kit);
            setIsInitialized(true);

            // Load existing wallet if available
            if (walletStore.hasWallet && authStore.isUnlocked) {
                await walletStore.loadWallet();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            console.error('Error initializing TON wallet:', err);
        }
    }, [walletStore, authStore.isUnlocked]);

    const createNewWallet = useCallback(async (): Promise<string[]> => {
        if (!tonKit) throw new Error('TON Kit not initialized');

        try {
            setError(null);
            const mnemonic = await mnemonicNew();

            // Create wallet with mnemonic
            await walletStore.createWallet(mnemonic);

            return mnemonic;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [tonKit, walletStore]);

    const importWallet = useCallback(
        async (mnemonic: string[]): Promise<void> => {
            if (!tonKit) throw new Error('TON Kit not initialized');

            try {
                setError(null);

                // Mock mnemonic validation - just check if it's 12 or 24 words
                const isValid = mnemonic.length === 12 || mnemonic.length === 24;

                if (!isValid) {
                    throw new Error('Invalid mnemonic phrase');
                }

                // Import wallet
                await walletStore.importWallet(mnemonic);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to import wallet';
                setError(errorMessage);
                throw new Error(errorMessage);
            }
        },
        [tonKit, walletStore],
    );

    const getBalance = useCallback(async (): Promise<string> => {
        if (!tonKit) throw new Error('TON Kit not initialized');

        try {
            setError(null);

            // Get mnemonic from store
            const mnemonic = await walletStore.getDecryptedMnemonic();
            if (!mnemonic) throw new Error('No wallet available');

            // Mock balance - simulate random balance between 0 and 10 TON
            // const randomBalance = Math.floor(Math.random() * 10000000000).toString(); // Random balance in nanoTON

            // walletStore.updateBalance(randomBalance);
            return '1';
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get balance';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [tonKit, walletStore]);

    const sendTransaction = useCallback(
        async (to: string, amount: string): Promise<void> => {
            if (!tonKit) throw new Error('TON Kit not initialized');

            try {
                setError(null);

                // Get mnemonic from store
                const mnemonic = await walletStore.getDecryptedMnemonic();
                if (!mnemonic) throw new Error('No wallet available');

                // Mock transaction sending - just simulate it
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

                // Add transaction to history
                walletStore.addTransaction({
                    id: Date.now().toString(),
                    type: 'send',
                    amount,
                    address: to,
                    timestamp: Date.now(),
                    status: 'confirmed', // Mock as confirmed immediately
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to send transaction';
                setError(errorMessage);
                throw new Error(errorMessage);
            }
        },
        [tonKit, walletStore],
    );

    // Auto-initialize when component mounts
    useEffect(() => {
        if (!isInitialized) {
            initializeWallet();
        }
    }, [initializeWallet, isInitialized]);

    return {
        tonKit,
        isInitialized,
        error,
        initializeWallet,
        createNewWallet,
        importWallet,
        getBalance,
        sendTransaction,
    };
};
