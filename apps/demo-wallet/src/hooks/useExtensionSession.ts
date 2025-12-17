/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useEffect, useCallback } from 'react';
import type { Browser } from 'webextension-polyfill';

import { isExtension } from '@/utils/isExtension';
import { SESSION_MESSAGE_TYPES } from '@/constants/sessionMessage';

// Dynamic import to avoid loading webextension-polyfill in web builds
let browserCache: Browser | null = null;

const getBrowser = async (): Promise<Browser | null> => {
    if (!isExtension()) {
        return null;
    }
    if (!browserCache) {
        const module = await import('webextension-polyfill');
        browserCache = module.default;
    }
    return browserCache;
};

export interface UseExtensionSessionReturn {
    /** Whether there's an active session (checked via getPassword) */
    hasSession: boolean;
    /** Whether the session status is being loaded */
    isLoading: boolean;
    /** Whether password remembering is enabled */
    rememberPassword: boolean;
    /** Store password in session */
    authenticate: (password: string) => Promise<void>;
    /** Get the session password (returns null if no session) */
    getPassword: () => Promise<string | null>;
    /** Lock the session */
    lock: () => Promise<void>;
    /** Set whether to remember password (true = 1 min, false = don't store) */
    setRememberPassword: (enabled: boolean) => void;
}

/**
 * Hook for managing extension session
 */
export function useExtensionSession(): UseExtensionSessionReturn {
    const [hasSession, setHasSession] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [rememberPassword, setRememberPasswordState] = useState(true);

    // Get session password - also used to check if session exists
    const getPassword = useCallback(async (): Promise<string | null> => {
        const browser = await getBrowser();
        if (!browser) {
            return null;
        }

        try {
            const response = (await browser.runtime.sendMessage({
                type: SESSION_MESSAGE_TYPES.GET_PASSWORD,
            })) as { password: string | null };

            setHasSession(!!response.password);
            return response.password;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[useExtensionSession] Failed to get password:', error);
            setHasSession(false);
            return null;
        }
    }, []);

    // Store password in session
    const authenticate = useCallback(async (password: string): Promise<void> => {
        const browser = await getBrowser();
        if (!browser) {
            return;
        }

        await browser.runtime.sendMessage({
            type: SESSION_MESSAGE_TYPES.AUTHENTICATE,
            payload: { password },
        });
        setHasSession(true);
    }, []);

    // Lock session
    const lock = useCallback(async (): Promise<void> => {
        const browser = await getBrowser();
        if (!browser) {
            return;
        }

        try {
            await browser.runtime.sendMessage({
                type: SESSION_MESSAGE_TYPES.LOCK,
            });
            setHasSession(false);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[useExtensionSession] Failed to lock:', error);
        }
    }, []);

    // Set remember password (true = 1 min, false = don't store)
    const setRememberPassword = useCallback((enabled: boolean) => {
        setRememberPasswordState(enabled);

        void (async () => {
            const browser = await getBrowser();
            if (!browser) {
                return;
            }

            await browser.runtime.sendMessage({
                type: SESSION_MESSAGE_TYPES.SET_DURATION,
                payload: { duration: enabled ? 60 * 1000 : 0 },
            });
        })();
    }, []);

    // Check session and load duration on mount
    useEffect(() => {
        if (!isExtension()) {
            setIsLoading(false);
            return;
        }

        const init = async () => {
            const browser = await getBrowser();
            if (!browser) {
                setIsLoading(false);
                return;
            }

            // Load current duration
            const response = (await browser.runtime.sendMessage({
                type: SESSION_MESSAGE_TYPES.GET_DURATION,
            })) as { duration: number };
            setRememberPasswordState(response.duration > 0);

            // Check session
            await getPassword();
            setIsLoading(false);
        };

        void init();
    }, [getPassword]);

    return {
        hasSession,
        isLoading,
        rememberPassword,
        authenticate,
        getPassword,
        lock,
        setRememberPassword,
    };
}
