/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// SAMPLE_START: APPKIT_REACT_HOOK
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { CreateAppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';
import type { AppKit } from '@ton/appkit';

export function useAppKit() {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const appKitRef = useRef<AppKit | null>(null);

    // Initialize AppKit when TonConnect is ready
    useEffect(() => {
        if (tonConnectUI.connector && !appKitRef.current) {
            appKitRef.current = CreateAppKit({
                networks: {
                    [Network.mainnet().chainId]: {
                        apiClient: {
                            key: process.env.NEXT_PUBLIC_TONCENTER_KEY,
                        },
                    },
                },
            });
        }
    }, [tonConnectUI.connector]);

    // Create wrapped wallet when connected
    const wrappedWallet = useMemo(() => {
        if (!wallet || !appKitRef.current || !tonConnectUI.connector) {
            return null;
        }
        return appKitRef.current.wrapTonConnectWallet(wallet, tonConnectUI.connector);
    }, [wallet, tonConnectUI.connector]);

    const disconnect = useCallback(async () => {
        await tonConnectUI.disconnect();
    }, [tonConnectUI]);

    return {
        isConnected: !!wallet,
        address: wallet?.account.address ?? null,
        wallet: wrappedWallet,
        disconnect,
    };
}
// SAMPLE_END: APPKIT_REACT_HOOK

export default useAppKit;
