/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnectUI } from '@tonconnect/ui';
import type { TonConnectUiCreateOptions } from '@tonconnect/ui';

import { TonConnectWalletAdapter } from '../adapters/ton-connect-wallet-adapter';
import { CONNECTOR_EVENTS } from '../../../core/app-kit';
import type { Connector, ConnectorMetadata } from '../../../types/connector';
import type { WalletInterface } from '../../../types/wallet';
import type { AppKitEmitter } from '../../../core/app-kit';
import { TONCONNECT_DEFAULT_CONNECTOR_ID } from '../constants/id';
import { createConnector } from '../../../types/connector';

export interface TonConnectConnectorConfig {
    id?: string;
    metadata?: ConnectorMetadata;
    tonConnectOptions?: TonConnectUiCreateOptions;
    tonConnectUI?: TonConnectUI;
}

export type TonConnectConnector = Connector & {
    type: 'tonconnect';
    tonConnectUI: TonConnectUI | null;
};

export const tonConnect = (config: TonConnectConnectorConfig) => {
    return createConnector(({ emitter, ssr }: { emitter: AppKitEmitter; ssr?: boolean }): TonConnectConnector => {
        let originalTonConnectUI: TonConnectUI | null = null;
        let unsubscribeTonConnect: (() => void) | null = null;

        const id = config.id ?? TONCONNECT_DEFAULT_CONNECTOR_ID;

        function getTonConnectUI() {
            if (originalTonConnectUI) {
                return originalTonConnectUI;
            }

            if (ssr && typeof window === 'undefined') {
                return null;
            }

            // check if we have pre-defined UI
            if (config.tonConnectUI) {
                originalTonConnectUI = config.tonConnectUI;
            } else {
                originalTonConnectUI = new TonConnectUI(config.tonConnectOptions);
            }

            setupListeners();

            // restore connection
            if (originalTonConnectUI) {
                originalTonConnectUI.connector.restoreConnection();
            }

            return originalTonConnectUI;
        }

        function getConnectedWallets(): WalletInterface[] {
            const ui = getTonConnectUI();

            if (ui && ui.connected && ui.wallet) {
                const wallet = ui.wallet;

                return [
                    new TonConnectWalletAdapter({
                        connectorId: id,
                        tonConnectWallet: wallet,
                        tonConnectUI: ui,
                    }),
                ];
            }

            return [];
        }

        function setupListeners() {
            if (!originalTonConnectUI || unsubscribeTonConnect) {
                return;
            }

            unsubscribeTonConnect = originalTonConnectUI.onStatusChange((wallet) => {
                const wallets = getConnectedWallets();

                if (wallet) {
                    emitter.emit(CONNECTOR_EVENTS.CONNECTED, { wallets, connectorId: id }, id);
                } else {
                    emitter.emit(CONNECTOR_EVENTS.DISCONNECTED, { connectorId: id }, id);
                }
            });
        }

        return {
            id,
            type: 'tonconnect',
            metadata: {
                name: 'TonConnect',
                iconUrl: 'https://avatars.githubusercontent.com/u/113980577',
                ...config.metadata,
            },

            get tonConnectUI() {
                return getTonConnectUI();
            },

            getConnectedWallets,

            async connectWallet(): Promise<void> {
                const ui = getTonConnectUI();

                if (ui) {
                    await ui.openModal();
                }
            },

            async disconnectWallet(): Promise<void> {
                const ui = getTonConnectUI();

                if (ui) {
                    await ui.disconnect();
                }
            },

            destroy() {
                unsubscribeTonConnect?.();
                originalTonConnectUI = null;
            },
        };
    });
};
