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
import { CONNECTOR_EVENTS, NETWORKS_EVENTS } from '../../../core/app-kit';
import type { Connector, ConnectorMetadata } from '../../../types/connector';
import type { WalletInterface } from '../../../types/wallet';
import { TONCONNECT_DEFAULT_CONNECTOR_ID } from '../constants/id';
import { createConnector } from '../../../types/connector';

/**
 * Configuration accepted by {@link createTonConnectConnector}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export interface TonConnectConnectorConfig {
    /** Connector ID. Defaults to {@link TONCONNECT_DEFAULT_CONNECTOR_ID} (`'tonconnect'`); set this when you need to register multiple TonConnect-flavoured connectors side by side. */
    id?: string;
    /** Display metadata override; merged on top of TonConnect's default name and icon. */
    metadata?: ConnectorMetadata;
    /** Options forwarded to the underlying `TonConnectUI` constructor (manifest URL, etc.). Ignored when `tonConnectUI` is supplied. */
    tonConnectOptions?: TonConnectUiCreateOptions;
    /** Pre-built `TonConnectUI` instance to reuse; when set, the connector skips its own instantiation and `tonConnectOptions` is ignored. */
    tonConnectUI?: TonConnectUI;
}

/**
 * {@link Connector} produced by {@link createTonConnectConnector} — extends the base interface with the underlying `TonConnectUI` instance for advanced flows that need direct access (e.g., custom modals).
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type TonConnectConnector = Connector & {
    type: 'tonconnect';
    /** Underlying `TonConnectUI` instance — `null` during SSR or before the connector has been initialised. Apps that need to drive the modal directly (e.g. custom UI flows) can read this and call its methods. */
    tonConnectUI: TonConnectUI | null;
};

/**
 * Build a TonConnect-backed {@link Connector} for AppKit; pass the result to {@link AppKitConfig}'s `connectors` or {@link addConnector}.
 *
 * @param config - {@link TonConnectConnectorConfig} Connector ID, metadata override and TonConnect options or pre-built UI instance.
 * @returns Factory function consumed by AppKit at registration time.
 *
 * @sample docs/examples/src/appkit/connectors/tonconnect#TON_CONNECT_CONNECTOR
 *
 * @public
 * @category Action
 * @section Connectors
 */
export const createTonConnectConnector = (config: TonConnectConnectorConfig) => {
    return createConnector(({ eventEmitter, networkManager, ssr }): TonConnectConnector => {
        let originalTonConnectUI: TonConnectUI | null = null;
        let unsubscribeTonConnect: (() => void) | null = null;
        let unsubscribeDefaultNetwork: (() => void) | null = null;
        let destroyed = false;

        const id = config.id ?? TONCONNECT_DEFAULT_CONNECTOR_ID;

        const getTonConnectUI = (): TonConnectUI | null => {
            if (destroyed) {
                return null;
            }

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
        };

        const getConnectedWallets = (): WalletInterface[] => {
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
        };

        const setupListeners = (): void => {
            if (!originalTonConnectUI || unsubscribeTonConnect) {
                return;
            }

            unsubscribeTonConnect = originalTonConnectUI.onStatusChange(() => {
                eventEmitter.emit(
                    CONNECTOR_EVENTS.WALLETS_UPDATED,
                    { connectorId: id, wallets: getConnectedWallets() },
                    id,
                );
            });

            // Set default network and subscribe to changes
            originalTonConnectUI.setConnectionNetwork(networkManager.getDefaultNetwork()?.chainId);
            unsubscribeDefaultNetwork = eventEmitter.on(NETWORKS_EVENTS.DEFAULT_CHANGED, ({ payload }) => {
                if (originalTonConnectUI) {
                    originalTonConnectUI.setConnectionNetwork(payload.network?.chainId);
                }
            });
        };

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
                destroyed = true;
                unsubscribeTonConnect?.();
                unsubscribeDefaultNetwork?.();
                unsubscribeTonConnect = null;
                unsubscribeDefaultNetwork = null;
                originalTonConnectUI = null;
            },
        };
    });
};
