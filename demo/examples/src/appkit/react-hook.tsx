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
import { AppKit, CONNECTOR_EVENTS, getConnectedWallets } from '@ton/appkit';
import type { WalletInterface } from '@ton/appkit';
import { TonConnectConnector } from '@ton/appkit/tonconnect';
import { Network } from '@ton/walletkit';

export function useAppKit() {
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const appKitRef = useRef<AppKit | null>(null);
    const [connectedWallet, setConnectedWallet] = useState<WalletInterface | null>(null);

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

            // Register TonConnect connector
            const connector = new TonConnectConnector({ tonConnect: tonConnectUI });
            appKit.addConnector(connector);

            // Listen for wallet changes
            const syncWallet = async () => {
                const wallets = getConnectedWallets(appKit);
                setConnectedWallet(wallets[0] ?? null);
            };

            appKit.emitter.on(CONNECTOR_EVENTS.CONNECTED, syncWallet);
            appKit.emitter.on(CONNECTOR_EVENTS.DISCONNECTED, syncWallet);

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
