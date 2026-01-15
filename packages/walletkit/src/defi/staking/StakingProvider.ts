/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { Network, TransactionRequest } from '../../api/models';
import type { NetworkManager } from '../../core/NetworkManager';
import type { EventEmitter } from '../../core/EventEmitter';
import type { SwapQuoteParams, SwapQuote, SwapParams, StakingProviderInterface } from './types';

export abstract class StakingProvider implements StakingProviderInterface {
    protected networkManager: NetworkManager;
    protected eventEmitter: EventEmitter;

    constructor(networkManager: NetworkManager, eventEmitter: EventEmitter) {
        this.networkManager = networkManager;
        this.eventEmitter = eventEmitter;
    }

    /**
     * Get a quote for swapping tokens
     * @param params - Quote parameters including tokens, amount, and network
     * @returns Promise resolving to swap quote with pricing information
     */
    abstract getQuote(params: SwapQuoteParams): Promise<SwapQuote>;

    /**
     * Build a transaction for executing the swap
     * @param params - Swap parameters including quote and user address
     * @returns Promise resolving to transaction request ready to be signed
     */
    abstract buildSwapTransaction(params: SwapParams): Promise<TransactionRequest>;

    /**
     * Get API client for a specific network
     * @param network - The network to get client for
     * @returns API client instance
     */
    protected getApiClient(network: Network): ApiClient {
        return this.networkManager.getClient(network);
    }

    /**
     * Emit an event through the event emitter
     * @param event - Event name
     * @param data - Event data
     */
    protected emitEvent(event: string, data: unknown): void {
        this.eventEmitter.emit(event, data);
    }
}
