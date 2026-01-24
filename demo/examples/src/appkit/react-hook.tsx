/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// SAMPLE_START: APPKIT_REACT_HOOK
import { useEffect, useCallback, useRef, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { AppKit, PROVIDER_EVENTS } from '@ton/appkit';
import { TonConnectProvider } from '@ton/appkit/tonconnect';
import { Network } from '@ton/walletkit';
import type { Wallet } from '@ton/walletkit';

export function useAppKit() {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const appKitRef = useRef<AppKit | null>(null);
    const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);

    // Initialize AppKit when TonConnect is ready
    useEffect(() => {
        if (tonConnectUI.connector && !appKitRef.current) {
            const appKit = new AppKit({
                networks: {
                    [Network.mainnet().chainId]: {
                        apiClient: {
                            key: process.env.NEXT_PUBLIC_TONCENTER_KEY,
                        },
                    },
                },
            });

            // Register TonConnect provider
            const provider = new TonConnectProvider({ tonConnect: tonConnectUI.connector });
            appKit.registerProvider(provider);

            // Listen for wallet changes
            const syncWallet = async () => {
                const wallets = appKit.getConnectedWallets();
                setConnectedWallet(wallets[0] ?? null);
            };

            appKit.eventBus.on(PROVIDER_EVENTS.CONNECTED, syncWallet);
            appKit.eventBus.on(PROVIDER_EVENTS.DISCONNECTED, syncWallet);

            appKitRef.current = appKit;
        }
    }, [tonConnectUI.connector]);

    const disconnect = useCallback(async () => {
        await tonConnectUI.disconnect();
    }, [tonConnectUI]);

    return {
        isConnected: !!wallet,
        address: wallet?.account.address ?? null,
        wallet: connectedWallet,
        disconnect,
    };
}
// SAMPLE_END: APPKIT_REACT_HOOK

export default useAppKit;
