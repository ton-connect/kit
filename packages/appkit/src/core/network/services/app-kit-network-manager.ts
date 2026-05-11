/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiClient } from '../../../types/api-client';
import type { Network } from '../../../types/network';
import { NETWORKS_EVENTS } from '../../app-kit/constants/events';
import type { AppKitEmitter } from '../../app-kit/types/events';
import { KitNetworkManager } from '../walletkit';

/**
 * Network manager exposed as {@link AppKit}'s `networkManager` — extends walletkit's `KitNetworkManager` with a default-network setter and AppKit event emission.
 *
 * @public
 * @category Class
 * @section Networks
 */
export class AppKitNetworkManager extends KitNetworkManager {
    private emitter: AppKitEmitter;
    private defaultNetwork: Network | undefined = undefined;

    /**
     * @param options - {@link TonWalletKitOptions} Forwarded to the {@link KitNetworkManager} base — chiefly the `networks` map keyed by chain id.
     * @param emitter - {@link AppKitEmitter} Emitter the manager publishes `networks:default-changed` / `networks:updated` events through.
     */
    constructor(options: ConstructorParameters<typeof KitNetworkManager>[0], emitter: AppKitEmitter) {
        super(options);
        this.emitter = emitter;
    }

    /**
     * Get the current default network
     */
    getDefaultNetwork(): Network | undefined {
        return this.defaultNetwork;
    }

    /**
     * Set the default network for wallet connections. Emits `networks:default-changed`;
     * connectors that listen for it (e.g., TonConnect) can re-bind their connection network.
     */
    setDefaultNetwork(network: Network | undefined): void {
        this.defaultNetwork = network;
        this.emitter.emit(NETWORKS_EVENTS.DEFAULT_CHANGED, { network }, 'network-manager');
    }

    override setClient(network: Network, client: ApiClient): void {
        super.setClient(network, client);
        this.emitter.emit(NETWORKS_EVENTS.UPDATED, {}, 'network-manager');
    }
}
