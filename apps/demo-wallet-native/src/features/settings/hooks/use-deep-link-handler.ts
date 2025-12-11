/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as Linking from 'expo-linking';
import { useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useTonConnect, useWalletStore } from '@ton/demo-core';

const extractTonConnectUrl = (deepLinkUrl: string): string | null => {
    if (deepLinkUrl.startsWith('tc://') || deepLinkUrl.startsWith('ton://')) {
        return deepLinkUrl;
    }

    const tkMatch = deepLinkUrl.match(/^tonkeeper:\/\/ton-connect\?(.+)$/);

    if (tkMatch) {
        return `tc://?${tkMatch[1]}`;
    }

    return null;
};

export const useDeepLinkHandler = (): void => {
    const { handleTonConnectUrl } = useTonConnect();

    const isUnlocked = useWalletStore((state) => state.auth.isUnlocked);
    const isProcessingRef = useRef(false);
    const pendingUrlRef = useRef<string | null>(null);

    const processDeepLink = useCallback(
        async (url: string | null) => {
            if (!url || isProcessingRef.current) return;

            const tonConnectUrl = extractTonConnectUrl(url);

            if (!tonConnectUrl) {
                return;
            }

            if (!isUnlocked) {
                pendingUrlRef.current = tonConnectUrl;
                return;
            }

            isProcessingRef.current = true;

            try {
                await handleTonConnectUrl(tonConnectUrl);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to handle deep link:', error);
                Alert.alert('Connection Failed', 'Failed to connect to the dApp. Please try again.');
            } finally {
                isProcessingRef.current = false;
            }
        },
        [handleTonConnectUrl, isUnlocked],
    );

    useEffect(() => {
        if (isUnlocked && pendingUrlRef.current) {
            const url = pendingUrlRef.current;
            pendingUrlRef.current = null;
            void (async () => {
                isProcessingRef.current = true;
                try {
                    await handleTonConnectUrl(url);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to handle pending deep link:', error);
                    Alert.alert('Connection Failed', 'Failed to connect to the dApp. Please try again.');
                } finally {
                    isProcessingRef.current = false;
                }
            })();
        }
    }, [isUnlocked, handleTonConnectUrl]);

    useEffect(() => {
        const handleInitialUrl = async (): Promise<void> => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                await processDeepLink(initialUrl);
            }
        };

        void handleInitialUrl();
    }, [processDeepLink]);

    useEffect(() => {
        const subscription = Linking.addEventListener('url', (event) => {
            void processDeepLink(event.url);
        });

        return () => {
            subscription.remove();
        };
    }, [processDeepLink]);
};
