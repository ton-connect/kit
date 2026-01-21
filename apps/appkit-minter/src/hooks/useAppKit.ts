/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useCallback, useRef } from 'react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@ton/appkit-ui-react';
import { CreateAppKit } from '@ton/appkit';
import type { AppKit } from '@ton/appkit';

export function useAppKit() {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const address = useTonAddress();
    const appKitRef = useRef<AppKit | null>(null);

    // Initialize AppKit when TonConnect is ready
    useEffect(() => {
        if (tonConnectUI.connector) {
            // const client = new ApiClientToncenter();
            appKitRef.current = CreateAppKit({});
        }
    }, [tonConnectUI.connector]);

    const disconnect = useCallback(async () => {
        await tonConnectUI.disconnect();
    }, [tonConnectUI]);

    const getAppKit = useCallback(() => {
        return appKitRef.current;
    }, []);

    const getTonConnect = useCallback(() => {
        return tonConnectUI.connector;
    }, [tonConnectUI.connector]);

    return {
        // State
        isConnected: !!wallet,
        address: address || null,
        wallet,
        tonConnectUI,

        // Actions
        disconnect,
        getAppKit,
        getTonConnect,
    };
}
