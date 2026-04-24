/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CONNECTOR_EVENTS, NETWORKS_EVENTS } from '../../../core/app-kit';
import { createConnector } from '../../../types/connector';
import type { Connector, ConnectorMetadata } from '../../../types/connector';
import type { Network } from '../../../types/network';
import type { WalletInterface } from '../../../types/wallet';
import { PRIVY_DEFAULT_CONNECTOR_ID } from '../constants/id';
import { PrivyWalletAdapter } from '../adapters/privy-wallet-adapter';
import type { PrivyState, PrivyTonWallet } from '../types/privy-state';
import { fetchPrivyTonWalletPublicKey } from '../utils/public-key';

export interface PrivyConnectorConfig {
    id?: string;
    metadata?: ConnectorMetadata;
    /** Privy app id — required to call the Privy REST API. */
    appId: string;
    /** Subwallet id override for V5R1. Defaults to walletkit's `defaultWalletIdV5R1`. */
    walletId?: number;
    /**
     * Fallback network used when the AppKit-level default network is unset.
     * Privy requires a concrete network to build its wallet adapter — this lets
     * the connector stay functional when the app leaves the default as "any".
     */
    defaultNetwork?: Network;
}

export type PrivyBuildStatus = 'idle' | 'building' | 'ready' | 'error' | 'skipped-no-network' | 'skipped-no-token';

export interface PrivyConnectorDebugInfo {
    status: PrivyBuildStatus;
    error: string | null;
    lastWalletId: string | null;
    hasLatestState: boolean;
    hasTonWallet: boolean;
}

export type PrivyConnector = Connector & {
    type: 'privy';
    /**
     * Push the latest Privy hook values into the connector. Called from
     * `<PrivyBridge>` in `@ton/appkit-react` whenever the underlying Privy
     * hooks (`usePrivy`, `useSignRawHash`) produce new values.
     */
    updatePrivyState(state: PrivyState): void;
    /** Diagnostic snapshot of the connector's internal build state — for debug UIs. */
    getDebugInfo(): PrivyConnectorDebugInfo;
};

export const createPrivyConnector = (config: PrivyConnectorConfig) => {
    return createConnector(({ eventEmitter, networkManager, ssr }): PrivyConnector => {
        const id = config.id ?? PRIVY_DEFAULT_CONNECTOR_ID;

        let latestState: PrivyState | null = null;
        let currentWallet: PrivyWalletAdapter | null = null;
        let currentWalletUuid: string | null = null;
        let inflightBuild = 0;
        let buildStatus: PrivyBuildStatus = 'idle';
        let lastBuildError: string | null = null;

        async function buildWallet(tonWallet: PrivyTonWallet, state: PrivyState): Promise<void> {
            const token = ++inflightBuild;
            buildStatus = 'building';
            lastBuildError = null;

            const network = networkManager.getDefaultNetwork() ?? config.defaultNetwork;
            if (!network) {
                buildStatus = 'skipped-no-network';
                return;
            }

            const accessToken = await state.getAccessToken();
            if (!accessToken) {
                buildStatus = 'skipped-no-token';
                return;
            }

            const publicKey = await fetchPrivyTonWalletPublicKey(tonWallet.walletId, accessToken, config.appId);

            // A newer update superseded this build — drop it.
            if (token !== inflightBuild) {
                return;
            }

            const apiClient = networkManager.getClient(network);
            const adapter = new PrivyWalletAdapter({
                connectorId: id,
                signerAddress: tonWallet.signerAddress,
                publicKey,
                network,
                apiClient,
                signRawHash: state.signRawHash,
                walletId: config.walletId,
            });

            currentWallet = adapter;
            currentWalletUuid = tonWallet.walletId;
            buildStatus = 'ready';
            eventEmitter.emit(CONNECTOR_EVENTS.CONNECTED, { wallets: [adapter], connectorId: id }, id);
        }

        function runBuild(tonWallet: PrivyTonWallet, state: PrivyState): void {
            buildWallet(tonWallet, state).catch((err) => {
                buildStatus = 'error';
                lastBuildError = err instanceof Error ? err.message : String(err);
            });
        }

        function clearWallet(): void {
            inflightBuild++;
            if (!currentWallet) {
                currentWalletUuid = null;
                return;
            }
            currentWallet = null;
            currentWalletUuid = null;
            eventEmitter.emit(CONNECTOR_EVENTS.DISCONNECTED, { connectorId: id }, id);
        }

        function applyState(state: PrivyState): void {
            latestState = state;

            if (ssr && typeof window === 'undefined') {
                return;
            }

            if (!state.tonWallet) {
                clearWallet();
                return;
            }

            if (state.tonWallet.walletId !== currentWalletUuid) {
                // walletId changed — rebuild from scratch.
                currentWallet = null;
                currentWalletUuid = null;
                runBuild(state.tonWallet, state);
                return;
            }

            if (!currentWallet) {
                runBuild(state.tonWallet, state);
            }
        }

        const unsubscribeNetwork = eventEmitter.on(NETWORKS_EVENTS.DEFAULT_CHANGED, () => {
            if (!latestState?.tonWallet) {
                return;
            }
            // Force a rebuild against the new network/client.
            currentWallet = null;
            currentWalletUuid = null;
            runBuild(latestState.tonWallet, latestState);
        });

        return {
            id,
            type: 'privy',
            metadata: {
                name: 'Privy',
                ...config.metadata,
            },

            updatePrivyState(state: PrivyState) {
                applyState(state);
            },

            getDebugInfo(): PrivyConnectorDebugInfo {
                return {
                    status: buildStatus,
                    error: lastBuildError,
                    lastWalletId: currentWalletUuid,
                    hasLatestState: latestState !== null,
                    hasTonWallet: Boolean(latestState?.tonWallet),
                };
            },

            getConnectedWallets(): WalletInterface[] {
                return currentWallet ? [currentWallet] : [];
            },

            async connectWallet(): Promise<void> {
                // Auth lifecycle is owned by the Privy SDK in the React tree; no-op here.
            },

            async disconnectWallet(): Promise<void> {
                clearWallet();
            },

            destroy() {
                unsubscribeNetwork();
                currentWallet = null;
                currentWalletUuid = null;
                latestState = null;
            },
        };
    });
};
