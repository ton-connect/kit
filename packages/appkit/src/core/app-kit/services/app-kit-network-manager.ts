/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiClient, Network } from '@ton/walletkit';
import { KitNetworkManager } from '@ton/walletkit';

import { NETWORKS_EVENTS } from '../constants/events';
import type { AppKitEmitter } from '../types/events';

export class AppKitNetworkManager extends KitNetworkManager {
    private emitter: AppKitEmitter;

    constructor(options: ConstructorParameters<typeof KitNetworkManager>[0], emitter: AppKitEmitter) {
        super(options);
        this.emitter = emitter;
    }

    override setClient(network: Network, client: ApiClient): void {
        super.setClient(network, client);
        this.emitter.emit(NETWORKS_EVENTS.UPDATED, {}, 'network-manager');
    }
}
