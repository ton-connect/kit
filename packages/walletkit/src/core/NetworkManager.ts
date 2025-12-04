/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Network management for multi-network support

import { CHAIN } from '@tonconnect/protocol';

import { ApiClient } from '../types/toncenter/ApiClient';
import { ApiClientConfig, TonWalletKitOptions } from '../types/config';
import { ApiClientToncenter } from './ApiClientToncenter';
import { globalLogger } from './Logger';
import { WalletKitError, ERROR_CODES } from '../errors';

const log = globalLogger.createChild('NetworkManager');

/**
 * Manages multiple API clients for different networks
 *
 * Each network (identified by CHAIN) has its own ApiClient instance.
 * At least one network must be configured.
 */
export class NetworkManager {
    private clients: Map<CHAIN, ApiClient> = new Map();

    constructor(options: TonWalletKitOptions) {
        this.initializeClients(options);

        // Validate at least one network is configured
        const configuredNetworks = this.getConfiguredNetworks();
        if (configuredNetworks.length === 0) {
            throw new WalletKitError(
                ERROR_CODES.CONFIGURATION_ERROR,
                'At least one network must be configured in TonWalletKitOptions.networks',
            );
        }
    }

    /**
     * Initialize API clients from configuration
     */
    private initializeClients(options: TonWalletKitOptions): void {
        const networks = options.networks;

        if (!networks) {
            log.warn('No networks configured in TonWalletKitOptions');
            return;
        }

        for (const [chainIdStr, networkConfig] of Object.entries(networks)) {
            const chainId = chainIdStr as CHAIN;

            if (!networkConfig) continue;

            const client = this.createClient(chainId, networkConfig.apiClient, options);
            this.clients.set(chainId, client);

            log.info('Initialized network client', { chainId });
        }
    }

    /**
     * Create an API client for a specific network
     */
    private createClient(
        network: CHAIN,
        apiClientConfig: ApiClientConfig | ApiClient | undefined,
        options: TonWalletKitOptions,
    ): ApiClient {
        // If a full ApiClient instance is provided, use it directly
        if (this.isApiClient(apiClientConfig)) {
            return apiClientConfig;
        }

        // Create a new ApiClientToncenter
        const defaultEndpoint = network === CHAIN.MAINNET ? 'https://toncenter.com' : 'https://testnet.toncenter.com';

        const endpoint = apiClientConfig?.url || defaultEndpoint;

        return new ApiClientToncenter({
            endpoint,
            apiKey: apiClientConfig?.key,
            network,
            disableNetworkSend: options.dev?.disableNetworkSend,
        });
    }

    /**
     * Type guard to check if value is a full ApiClient instance
     */
    private isApiClient(value: ApiClientConfig | ApiClient | undefined): value is ApiClient {
        return (
            !!value &&
            'nftItemsByAddress' in value &&
            'nftItemsByOwner' in value &&
            'fetchEmulation' in value &&
            'sendBoc' in value &&
            'runGetMethod' in value &&
            'getAccountState' in value &&
            'getBalance' in value
        );
    }

    /**
     * Get API client for a specific network
     * @param chainId - The chain ID (CHAIN.MAINNET or CHAIN.TESTNET)
     * @returns The API client for the specified network
     * @throws WalletKitError if no client is configured for the network
     */
    getClient(chainId: CHAIN): ApiClient {
        const client = this.clients.get(chainId);
        if (!client) {
            throw new WalletKitError(
                ERROR_CODES.NETWORK_NOT_CONFIGURED,
                `No API client configured for network ${chainId}`,
                undefined,
                {
                    chainId,
                    configuredNetworks: Array.from(this.clients.keys()),
                },
            );
        }
        return client;
    }

    /**
     * Check if a network is configured
     */
    hasNetwork(chainId: CHAIN): boolean {
        return this.clients.has(chainId);
    }

    /**
     * Get all configured networks
     */
    getConfiguredNetworks(): CHAIN[] {
        return Array.from(this.clients.keys());
    }

    /**
     * Add or update a network client dynamically
     */
    setClient(chainId: CHAIN, client: ApiClient): void {
        this.clients.set(chainId, client);
        log.info('Added/updated network client', { chainId });
    }
}
