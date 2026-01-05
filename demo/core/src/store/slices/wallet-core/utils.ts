/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createDeviceInfo, createWalletManifest, TonWalletKit, CHAIN } from '@ton/walletkit';
import type { ITonWalletKit } from '@ton/walletkit';

import type { WalletKitConfig } from '../../../types';
import { getTonConnectDeviceInfo, getTonConnectWalletManifest, isExtension } from '../../../utils';
import { createComponentLogger } from '../../../utils/logger';

export const walletCoreLog = createComponentLogger('WalletCoreSlice');

export const createWalletKitInstance = async (walletKitConfig?: WalletKitConfig): Promise<ITonWalletKit> => {
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
                    key: walletKitConfig?.tonApiKeyMainnet,
                },
            },
            [CHAIN.TESTNET]: {
                apiClient: {
                    url: 'https://testnet.toncenter.com',
                    key: walletKitConfig?.tonApiKeyTestnet,
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

    walletCoreLog.info(`WalletKit initialized with network: ${isExtension() ? 'extension' : 'web'}`);
    return walletKit;
};
