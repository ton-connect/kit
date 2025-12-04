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

const ENV_TON_API_KEY_MAINNET = '25a9b2326a34b39a5fa4b264fb78fb4709e1bd576fc5e6b176639f5b71e94b0d';
const ENV_TON_API_KEY_TESTNET = 'd852b54d062f631565761042cccea87fa6337c41eb19b075e6c7fb88898a3992';

/**
 * Creates a WalletKit instance with the specified network configuration
 */
async function createWalletKitInstance(walletKitConfig?: WalletKitConfig): Promise<ITonWalletKit> {
    const walletKit = new TonWalletKit({
        deviceInfo: createDeviceInfo(getTonConnectDeviceInfo()),
        walletManifest: createWalletManifest(getTonConnectWalletManifest()),

        bridge: {
            bridgeUrl: walletKitConfig?.bridgeUrl,
            disableHttpConnection: walletKitConfig?.disableHttpBridge,
            jsBridgeTransport: walletKitConfig?.jsBridgeTransport,
        },

        networks: {
            [CHAIN.MAINNET]: {
                apiClient: {
                    url: 'https:/toncenter.com',
                    key: ENV_TON_API_KEY_MAINNET,
                },
            },
            [CHAIN.TESTNET]: {
                apiClient: {
                    url: 'https://testnet.toncenter.com',
                    key: ENV_TON_API_KEY_TESTNET,
                },
            },
        },

        storage: walletKitConfig?.storage,

        analytics: {
            enabled: true,
        },

        dev: {
            disableNetworkSend: walletKitConfig?.disableNetworkSend,
        },
    }) as ITonWalletKit;

    log.info(`WalletKit initialized with network: ${isExtension() ? 'extension' : 'web'}`);
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
            const walletKitPromise = createWalletKitInstance(walletKitConfig);

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
