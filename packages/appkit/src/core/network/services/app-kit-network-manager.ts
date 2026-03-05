/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiClient } from '@ton/walletkit';
import { KitNetworkManager } from '@ton/walletkit';

import { NETWORKS_EVENTS } from '../../app-kit/constants/events';
import type { AppKitEmitter } from '../../app-kit/types/events';
import type { Network } from '../../../types/network';

export class AppKitNetworkManager extends KitNetworkManager {
    private emitter: AppKitEmitter;
    private defaultNetwork: Network | undefined = undefined;

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
     * Set the default network for wallet connections.
     * Emits a change event and propagates to all connectors.
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
