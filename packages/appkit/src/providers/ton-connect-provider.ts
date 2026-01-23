/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet as WalletInterface, NetworkManager } from '@ton/walletkit';
import { Network } from '@ton/walletkit';
import type { ITonConnect } from '@tonconnect/sdk';

import { TonConnectWalletWrapperImpl } from '../adapters/ton-connect-wallet-wrapper';
import type { WalletProvider } from '../types';
import type { EventBus } from '../core/events';
import { WALLET_EVENTS } from '../core/events';

export interface TonConnectProviderConfig {
    id?: string;
    tonConnect: ITonConnect;
}

export class TonConnectProvider implements WalletProvider {
    readonly id: string;
    readonly type = 'tonconnect/sdk';

    private tonConnect: ITonConnect;
    private networkManager: NetworkManager | null = null;
    private eventBus: EventBus | null = null;
    private unsubscribeTonConnect: (() => void) | null = null;

    constructor(config: TonConnectProviderConfig) {
        this.id = config.id ?? 'tonconnect-default';
        this.tonConnect = config.tonConnect;
    }

    async initialize(eventBus: EventBus, networkManager: NetworkManager): Promise<void> {
        this.eventBus = eventBus;
        this.networkManager = networkManager;

        // Subscribe to TonConnect status changes
        this.unsubscribeTonConnect = this.tonConnect.onStatusChange((wallet) => {
            const wallets = this.getConnectedWallets();

            if (wallet) {
                this.eventBus?.emit(WALLET_EVENTS.CONNECTED, { wallets, providerId: this.id }, this.id);
            } else {
                this.eventBus?.emit(WALLET_EVENTS.DISCONNECTED, { providerId: this.id }, this.id);
            }
        });

        // Restore existing connection
        await this.tonConnect.restoreConnection();
    }

    destroy(): void {
        this.unsubscribeTonConnect?.();
        this.unsubscribeTonConnect = null;
        this.eventBus = null;
        this.networkManager = null;
    }

    async connectWallet(): Promise<void> {
        // Connection flow is handled by UI (modal with QR code, etc.)
        // This method can be extended for programmatic connection
    }

    async disconnectWallet(): Promise<void> {
        if (this.tonConnect.connected) {
            await this.tonConnect.disconnect();
        }
    }

    getConnectedWallets(): WalletInterface[] {
        if (!this.networkManager) {
            return [];
        }

        if (this.tonConnect.connected && this.tonConnect.wallet) {
            const wallet = this.tonConnect.wallet;
            const client = this.networkManager.getClient(Network.custom(wallet.account.chain));

            const wrapper = new TonConnectWalletWrapperImpl({
                tonConnectWallet: wallet,
                tonConnect: this.tonConnect,
                client,
            });
            return [wrapper];
        }
        return [];
    }
}
