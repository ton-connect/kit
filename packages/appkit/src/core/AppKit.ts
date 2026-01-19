/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ITonConnect, Wallet } from '@tonconnect/sdk';
import type { NetworkManager } from '@ton/walletkit';
import { Network, KitNetworkManager } from '@ton/walletkit';

import type { AppKit, AppKitConfig, TonConnectWalletWrapper } from '../types';
import { TonConnectWalletWrapperImpl } from '../adapters/TonConnectWalletWrapper';

/**
 * Bridge between @tonconnect/sdk and TonWalletKit.
 * Wraps TonConnect wallets to provide TonWalletKit-compatible interface.
 */
export class AppKitImpl implements AppKit {
    private networkManager!: NetworkManager;

    private constructor() {}

    /**
     * Create a new AppKit instance
     */
    static create(config: AppKitConfig): AppKit {
        const appKit = new AppKitImpl();

        // Use provided networks config or default to mainnet
        const networks = config.networks ?? {
            [Network.mainnet().chainId]: {},
        };

        const networkManager = new KitNetworkManager({ networks });
        appKit.networkManager = networkManager;

        return appKit;
    }

    /**
     * Create a TonWalletKit-compatible wrapper for a TonConnect wallet
     */
    wrapTonConnectWallet(wallet: Wallet, tonConnect: ITonConnect): TonConnectWalletWrapper {
        return new TonConnectWalletWrapperImpl({
            tonConnectWallet: wallet,
            tonConnect: tonConnect,
            client: this.networkManager.getClient(Network.custom(wallet.account.chain)),
        });
    }
}

export function CreateAppKit(config: AppKitConfig): AppKit {
    return AppKitImpl.create(config);
}
