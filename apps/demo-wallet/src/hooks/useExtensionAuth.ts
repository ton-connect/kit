/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useCallback, useRef } from 'react';
import { useWalletStore } from '@ton/demo-core';

import { useExtensionSession } from './useExtensionSession';

import { isExtension } from '@/utils/isExtension';

export interface UseExtensionAuthReturn {
    /** Whether there's an active session */
    hasSession: boolean;
    /** Whether the session status is being loaded */
    isLoading: boolean;
    /** Whether wallet is unlocked (from store) */
    isUnlocked: boolean;
    /** Unlock wallet with password */
    unlock: (password: string) => Promise<boolean>;
    /** Lock wallet */
    lock: () => Promise<void>;
    /** Load wallets after unlock */
    loadWallets: () => Promise<void>;
    /** Whether password remembering is enabled */
    rememberPassword: boolean;
    /** Set whether to remember password */
    setRememberPassword: (enabled: boolean) => void;
    /** Store password in session (use after setPassword for first-time setup) */
    savePasswordToSession: (password: string) => Promise<void>;
}

/**
 * Hook that integrates extension session with Zustand auth store
 */
export function useExtensionAuth(): UseExtensionAuthReturn {
    const session = useExtensionSession();
    const isInitializedRef = useRef(false);

    // Get store state and actions
    const storeIsUnlocked = useWalletStore((state) => !!state.auth.isUnlocked);
    const storeLock = useWalletStore((state) => state.lock);
    const storeUnlock = useWalletStore((state) => state.unlock);
    const loadAllWallets = useWalletStore((state) => state.loadAllWallets);

    // Sync session password to store on mount (auto-unlock if session exists)
    useEffect(() => {
        if (!isExtension() || session.isLoading || isInitializedRef.current) {
            return;
        }

        const syncSessionToStore = async () => {
            if (session.hasSession && !storeIsUnlocked) {
                // Session exists but store is locked - sync password to store
                const password = await session.getPassword();

                if (password) {
                    // Unlock store with session password
                    await storeUnlock(password);
                    isInitializedRef.current = true;
                }
            }
        };

        void syncSessionToStore();
    }, [session.hasSession, session.isLoading, storeIsUnlocked, session.getPassword, storeUnlock]);

    // Unlock with password
    const unlock = useCallback(
        async (password: string): Promise<boolean> => {
            if (!isExtension()) {
                // Fallback to regular store unlock for non-extension
                return storeUnlock(password);
            }

            // First unlock the store (validates password)
            const success = await storeUnlock(password);

            if (success) {
                // Then store password in session
                await session.authenticate(password);
            }

            return success;
        },
        [session, storeUnlock],
    );

    // Lock wallet
    const lock = useCallback(async (): Promise<void> => {
        if (isExtension()) {
            await session.lock();
        }
        storeLock();
    }, [session, storeLock]);

    // Load wallets after unlock
    const loadWallets = useCallback(async (): Promise<void> => {
        if (!isExtension()) {
            await loadAllWallets();
            return;
        }

        // Get password from session and set it in store before loading
        const password = await session.getPassword();
        if (!password) {
            throw new Error('No active session');
        }

        // Ensure store is unlocked with session password
        if (!storeIsUnlocked) {
            await storeUnlock(password);
        }

        await loadAllWallets();
    }, [session, loadAllWallets, storeUnlock, storeIsUnlocked]);

    return {
        hasSession: session.hasSession,
        isLoading: session.isLoading,
        isUnlocked: storeIsUnlocked,
        unlock,
        lock,
        loadWallets,
        rememberPassword: session.rememberPassword,
        setRememberPassword: session.setRememberPassword,
        savePasswordToSession: session.authenticate,
    };
}
