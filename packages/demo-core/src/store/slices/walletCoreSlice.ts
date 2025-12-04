/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonWalletKit, CHAIN, type ITonWalletKit, createDeviceInfo, createWalletManifest } from '@ton/walletkit';

import { createComponentLogger } from '../../utils/logger';
import { isExtension } from '../../utils/isExtension';
import { getTonConnectDeviceInfo, getTonConnectWalletManifest } from '../../utils/walletManifest';
import type { SetState, WalletCoreSliceCreator } from '../../types/store';
import type { WalletKitConfig } from '../../types/wallet';

const log = createComponentLogger('WalletCoreSlice');

/**
 * Creates a WalletKit instance with the specified network configuration
 */
async function createWalletKitInstance(
    network: 'mainnet' | 'testnet' = 'testnet',
    walletKitConfig?: WalletKitConfig,
): Promise<ITonWalletKit> {
    const walletKit = new TonWalletKit({
        deviceInfo: createDeviceInfo(getTonConnectDeviceInfo()),
        walletManifest: createWalletManifest(getTonConnectWalletManifest()),

        bridge: {
            bridgeUrl: walletKitConfig?.bridgeUrl,
            disableHttpConnection: walletKitConfig?.disableHttpBridge,
            jsBridgeTransport: walletKitConfig?.jsBridgeTransport,
        },

        network: network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET,
        apiClient: {
            key: network === 'mainnet' ? walletKitConfig?.tonApiKeyMainnet : walletKitConfig?.tonApiKeyTestnet,
        },

        storage: walletKitConfig?.storage,

        analytics: {
            enabled: true,
        },

        dev: {
            disableNetworkSend: walletKitConfig?.disableNetworkSend,
        },
    }) as ITonWalletKit;

    log.info(`WalletKit initialized with network: ${network} ${isExtension() ? 'extension' : 'web'}`);
    return walletKit;
}

export const createWalletCoreSlice =
    (walletKitConfig: WalletKitConfig): WalletCoreSliceCreator =>
    (set: SetState, get) => ({
        walletCore: {
            walletKit: null,
            walletKitInitializer: null,
        },

        initializeWalletKit: (network: 'mainnet' | 'testnet' = 'testnet'): Promise<void> => {
            const state = get();

            // Check if we need to reinitialize
            if (state.walletCore.walletKit) {
                const currentNetwork = state.walletCore.walletKit.getNetwork();
                const targetNetwork = network === 'mainnet' ? CHAIN.MAINNET : CHAIN.TESTNET;

                if (currentNetwork === targetNetwork) {
                    log.info(`WalletKit already initialized with network: ${network}`);
                    return Promise.resolve();
                }

                log.info(`Reinitializing WalletKit to ${network}`);
                try {
                    const existingWallets = state.walletCore.walletKit.getWallets();
                    log.info(`Clearing ${existingWallets.length} existing wallets before reinitialization`);
                } catch (error) {
                    log.warn('Error during cleanup:', error);
                }
            }

            // Create initializer promise for other slices to await
            let initResolve: () => void;
            let initReject: (error: Error) => void;
            const initializer = new Promise<void>((resolve, reject) => {
                initResolve = resolve;
                initReject = reject;
            });

            set((state) => {
                state.walletCore.walletKitInitializer = initializer;
            });

            // Create new WalletKit instance
            const walletKitPromise = createWalletKitInstance(network, walletKitConfig);

            walletKitPromise
                .then(async (walletKit) => {
                    // Setup event listeners from tonConnectSlice
                    get().setupTonConnectListeners(walletKit);

                    set((state) => {
                        state.walletCore.walletKit = walletKit;
                    });

                    // Load all saved wallets into the WalletKit instance
                    await get().loadSavedWalletsIntoKit(walletKit);

                    return walletKit;
                })
                .then(() => {
                    initResolve();
                })
                .catch((error) => {
                    initReject(error);
                });

            return initializer;
        },
    });
