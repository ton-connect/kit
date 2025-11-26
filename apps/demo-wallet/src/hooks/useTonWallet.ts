/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState, useCallback } from 'react';
import { CreateTonMnemonic } from '@ton/walletkit';

import { useWallet, useAuth } from '../stores';
import { createComponentLogger } from '../utils/logger';

// Create logger for TON wallet hook
const log = createComponentLogger('useTonWallet');

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
    createLedgerWallet: () => Promise<void>;
    importWallet: (mnemonic: string[], version?: 'v5r1' | 'v4r2') => Promise<void>;
    sendTransaction: (to: string, amount: string) => Promise<void>;
}

export const useTonWallet = (): UseTonWalletReturn => {
    const [tonKit, setTonKit] = useState<MockTonKit | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const walletStore = useWallet();
    const authStore = useAuth();

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
                await walletStore.loadAllWallets();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            log.error('Error initializing TON wallet:', err);
        }
    }, [walletStore, authStore.isUnlocked]);

    const createNewWallet = useCallback(async (): Promise<string[]> => {
        if (!tonKit) throw new Error('TON Kit not initialized');

        try {
            setError(null);
            const mnemonic = await CreateTonMnemonic();

            // Create wallet with mnemonic
            await walletStore.createWallet(mnemonic);

            return mnemonic;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [tonKit, walletStore]);

    const createLedgerWallet = useCallback(async (): Promise<void> => {
        if (!tonKit) throw new Error('TON Kit not initialized');

        try {
            setError(null);

            // Create Ledger wallet
            await walletStore.createLedgerWallet();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create Ledger wallet';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [tonKit, walletStore]);

    const importWallet = useCallback(
        async (mnemonic: string[], version?: 'v5r1' | 'v4r2'): Promise<void> => {
            if (!tonKit) throw new Error('TON Kit not initialized');

            try {
                setError(null);

                // Mock mnemonic validation - just check if it's 12 or 24 words
                const isValid = mnemonic.length === 12 || mnemonic.length === 24;

                if (!isValid) {
                    throw new Error('Invalid mnemonic phrase');
                }

                // Import wallet
                await walletStore.importWallet(mnemonic, undefined, version);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to import wallet';
                setError(errorMessage);
                throw new Error(errorMessage);
            }
        },
        [tonKit, walletStore],
    );

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
                    messageHash: '',
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
        createLedgerWallet,
        importWallet,
        sendTransaction,
    };
};
