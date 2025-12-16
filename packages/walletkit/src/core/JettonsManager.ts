/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Jettons API Manager - handles jetton information caching and retrieval

import { Address } from '@ton/core';
import type { CHAIN } from '@tonconnect/protocol';
import { LRUCache } from 'lru-cache';

import type { EmulationTokenInfoMasters } from '../types/toncenter/emulation';
import { globalLogger } from './Logger';
import type { EventEmitter } from './EventEmitter';
import type { JettonInfo, JettonsAPI } from '../types/jettons';
import { JettonError, JettonErrorCode } from '../types/jettons';
import type { NetworkManager } from './NetworkManager';
import type { Jetton } from '../api/models';
import { Network } from '../api/models';

const log = globalLogger.createChild('JettonsManager');

/**
 * Creates a cache key that includes the network ID
 */
function createCacheKey(network: Network, address: string): string {
    return `${network.chainId}:${address}`;
}

/**
 * JettonsManager - manages jetton information with LRU caching and TonCenter API integration
 * Jettons are cached per network to support multi-network scenarios
 */
export class JettonsManager implements JettonsAPI {
    private cache: LRUCache<string, JettonInfo>;
    private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

    constructor(
        cacheSize: number = 10000,
        private eventEmitter: EventEmitter,
        private networkManager: NetworkManager,
    ) {
        this.cache = new LRUCache({
            max: cacheSize,
            ttl: 1000 * 60 * 10, // 10 minutes TTL
        });

        // Add TON for all configured networks
        for (const network of this.networkManager.getConfiguredNetworks()) {
            this.addTonToCache(network);
        }

        log.info('JettonsManager initialized', { cacheSize });

        // Set up event listener for emulation results for jetton caching
        // TODO Fix network in emulation result
        this.eventEmitter.on('emulation:result', (emulationResult: unknown) => {
            if (
                emulationResult &&
                typeof emulationResult === 'object' &&
                'metadata' in emulationResult &&
                'network' in emulationResult
            ) {
                const network = (emulationResult as { network: CHAIN }).network;
                this.addJettonsFromEmulationMetadata(
                    Network.custom(network),
                    (emulationResult as { metadata: Record<string, { is_indexed: boolean; token_info?: unknown[] }> })
                        .metadata,
                );
            }
        });
    }

    /**
     * Add TON native token to cache for a specific network
     */
    private addTonToCache(network: Network): void {
        const cacheKey = createCacheKey(network, 'TON');
        this.cache.set(cacheKey, {
            address: 'TON',
            name: 'TON',
            symbol: 'TON',
            description: 'The Open Network native token',
            decimals: 9,
            totalSupply: '5000000000000000000',
            image: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/ee9fb21d17bc8d75c2a5f7b5f5f62d2bacec6b128f58b63cb841e98f7b74c4fc',
            verification: {
                verified: true,
                source: 'manual' as const,
            },
        });
    }

    /**
     * Get jetton information by address for a specific network
     * @param jettonAddress - The jetton master address
     * @param network - The network to query (required)
     */
    async getJettonInfo(jettonAddress: string, network: Network): Promise<JettonInfo | null> {
        const targetNetwork = network;

        try {
            const normalizedAddress = this.normalizeAddress(jettonAddress);
            const cacheKey = createCacheKey(targetNetwork, normalizedAddress);
            const cachedInfo = this.cache.get(cacheKey);

            if (cachedInfo) {
                log.debug('Jetton info found in cache', { jettonAddress: normalizedAddress, network: targetNetwork });
                return cachedInfo;
            }

            log.debug('Jetton info not found in cache', { jettonAddress: normalizedAddress, network: targetNetwork });

            const apiClient = this.networkManager.getClient(targetNetwork);
            const jettonFromApi = await apiClient.jettonsByAddress({
                address: normalizedAddress,
                offset: 0,
                limit: 1,
            });

            if (jettonFromApi && jettonFromApi?.jetton_masters?.length > 0 && jettonFromApi?.jetton_masters?.[0]) {
                const jetton = jettonFromApi?.jetton_masters?.[0];
                const metadata = jettonFromApi?.metadata?.[jetton.address];
                const tokenInfo = metadata?.token_info?.find((t) => t.valid && t.type === 'jetton_masters') as
                    | EmulationTokenInfoMasters
                    | undefined;

                let decimals: number;
                try {
                    decimals = parseInt(tokenInfo?.extra.decimals as string, 10);
                } catch {
                    decimals = 9;
                }

                const result: JettonInfo = {
                    address: jetton.jetton,
                    name: tokenInfo?.name ?? '',
                    symbol: tokenInfo?.symbol ?? '',
                    description: tokenInfo?.description ?? '',
                    decimals: decimals,
                    image: tokenInfo?.image,
                    uri: tokenInfo?.extra?.uri,
                    totalSupply: '0',
                };
                this.cache.set(cacheKey, result);

                return result;
            }
            return null;
        } catch (error) {
            log.error('Error getting jetton info', { error, jettonAddress, network: targetNetwork });
            return null;
        }
    }

    /**
     * Get jettons for a specific address on a specific network
     * @param userAddress - The user's wallet address
     * @param network - The network to query (required)
     * @param offset - Pagination offset
     * @param limit - Pagination limit
     */
    async getAddressJettons(
        userAddress: string,
        network: Network,
        offset: number = 0,
        limit: number = 50,
    ): Promise<Jetton[]> {
        const targetNetwork = network;

        try {
            const apiClient = this.networkManager.getClient(targetNetwork);
            const normalizedAddress = this.normalizeAddress(userAddress);
            log.debug('Getting address jettons', {
                userAddress: normalizedAddress,
                network: targetNetwork,
                offset,
                limit,
            });

            const response = await apiClient.jettonsByOwnerAddress({
                ownerAddress: normalizedAddress,
                offset,
                limit,
            });

            if (!response.jettons) {
                return [];
            }

            const addressJettons: Jetton[] = [];

            for (const item of response.jettons) {
                addressJettons.push(item);
            }

            log.debug('Retrieved address jettons', { count: addressJettons.length, network: targetNetwork });
            return addressJettons;
        } catch (error) {
            log.error('Failed to get address jettons', { error, userAddress, network: targetNetwork });
            throw new JettonError(
                `Failed to get jettons for address: ${error instanceof Error ? error.message : 'Unknown error'}`,
                JettonErrorCode.NETWORK_ERROR,
                error,
            );
        }
    }

    /**
     * Add jetton info to cache from emulation data for a specific network
     */
    addJettonFromEmulation(network: Network, jettonAddress: string, emulationInfo: EmulationTokenInfoMasters): void {
        try {
            const normalizedAddress = this.normalizeAddress(jettonAddress);
            const cacheKey = createCacheKey(network, normalizedAddress);

            const jettonInfo: JettonInfo = {
                address: normalizedAddress,
                name: emulationInfo.name,
                symbol: emulationInfo.symbol,
                description: emulationInfo.description,
                image: emulationInfo.image,
                decimals:
                    typeof emulationInfo.extra.decimals === 'string'
                        ? parseInt(emulationInfo.extra.decimals, 10)
                        : (emulationInfo.extra.decimals as number),
                uri: emulationInfo.extra.uri,
            };

            this.cache.set(cacheKey, jettonInfo);
            log.debug('Added jetton info from emulation to cache', {
                jettonAddress: normalizedAddress,
                network,
                name: jettonInfo.name,
                symbol: jettonInfo.symbol,
            });
        } catch (error) {
            log.error('Error adding jetton from emulation', { error, jettonAddress, network });
        }
    }

    /**
     * Add multiple jettons from emulation metadata for a specific network
     */
    addJettonsFromEmulationMetadata(
        network: Network,
        metadata: Record<
            string,
            {
                is_indexed: boolean;
                token_info?: unknown[];
            }
        >,
    ): void {
        try {
            let addedCount = 0;

            for (const [jettonAddress, addressMetadata] of Object.entries(metadata)) {
                if (!addressMetadata.is_indexed || !addressMetadata.token_info) {
                    continue;
                }

                const jettonMasterInfo = addressMetadata.token_info.find(
                    (info: unknown) =>
                        typeof info === 'object' &&
                        info !== null &&
                        'type' in info &&
                        (info as { type: string }).type === 'jetton_masters',
                ) as EmulationTokenInfoMasters | undefined;

                if (jettonMasterInfo) {
                    log.debug('Adding jetton from emulation metadata', { jettonAddress, network });
                    this.addJettonFromEmulation(network, jettonAddress, jettonMasterInfo);
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                log.info('Added jettons from emulation metadata', { addedCount, network });
            }
        } catch (error) {
            log.error('Error adding jettons from emulation metadata', { error, network });
        }
    }

    /**
     * Normalize jetton address for consistent caching
     */
    private normalizeAddress(address: string): string {
        if (address === 'TON') {
            return 'TON';
        }
        return Address.parse(address).toRawString().toUpperCase();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; capacity: number } {
        return {
            size: this.cache.size,
            capacity: this.cache.max,
        };
    }

    /**
     * Validate jetton address format
     */
    validateJettonAddress(address: string): boolean {
        try {
            if (address === 'TON') {
                return true;
            }

            // Use TON Address parsing to validate
            Address.parse(address);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Clear the jetton cache for all networks or a specific network
     */
    clearCache(network?: Network): void {
        if (network) {
            // Clear only entries for the specific network
            for (const key of this.cache.keys()) {
                if (key.startsWith(`${network.chainId}:`)) {
                    this.cache.delete(key);
                }
            }
            // Re-add TON for this network
            this.addTonToCache(network);
            log.info('Jetton cache cleared for network', { network });
        } else {
            // Clear all entries
            this.cache.clear();
            // Re-add TON for all configured networks
            for (const net of this.networkManager.getConfiguredNetworks()) {
                this.addTonToCache(net);
            }
            log.info('Jetton cache cleared for all networks');
        }
    }
}
