// Jettons API Manager - handles jetton information caching and retrieval

import { Address } from '@ton/core';
import { LRUCache } from 'lru-cache';

import type { EmulationTokenInfoMasters } from '../types/toncenter/emulation';
import { globalLogger } from './Logger';
import { EventEmitter } from './EventEmitter';
import { JettonInfo, AddressJetton, JettonError, JettonErrorCode, JettonsAPI } from '../types/jettons';
import { ApiClient } from '../types/toncenter/ApiClient';

const log = globalLogger.createChild('JettonsManager');

/**
 * Legacy JettonInfo interface for backward compatibility
 */
export interface LegacyJettonInfo {
    address: string;
    name: string;
    symbol: string;
    description: string;
    image: string;
    decimals: number;
    uri?: string;
    extra?: Record<string, unknown>;
}

/**
 * JettonsManager - manages jetton information with LRU caching and TonCenter API integration
 */
export class JettonsManager implements JettonsAPI {
    private cache: LRUCache<string, JettonInfo>;
    // private readonly TONCENTER_V3_BASE = 'https://toncenter.com/api/v3';
    private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

    constructor(
        cacheSize: number = 10000,
        private eventEmitter: EventEmitter,
        private apiClient?: ApiClient,
    ) {
        this.cache = new LRUCache({
            max: cacheSize,
            ttl: 1000 * 60 * 10, // 10 minutes TTL
        });
        this.cache.set('TON', {
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

        log.info('JettonsManager initialized', { cacheSize });

        // Set up event listener for emulation results for jetton caching
        this.eventEmitter.on('emulation:result', (emulationResult: unknown) => {
            if (emulationResult && typeof emulationResult === 'object' && 'metadata' in emulationResult) {
                this.addJettonsFromEmulationMetadata(
                    emulationResult.metadata as Record<
                        string,
                        {
                            is_indexed: boolean;
                            token_info?: unknown[];
                        }
                    >,
                );
            }
        });
    }

    /**
     * Get jetton information by address (sync - cache only)
     */
    getJettonInfo(jettonAddress: string): JettonInfo | null {
        try {
            const normalizedAddress = this.normalizeAddress(jettonAddress);
            const cachedInfo = this.cache.get(normalizedAddress);

            if (cachedInfo) {
                log.debug('Jetton info found in cache', { jettonAddress: normalizedAddress });
                return cachedInfo;
            }

            log.debug('Jetton info not found in cache', { jettonAddress: normalizedAddress });
            return null;
        } catch (error) {
            log.error('Error getting jetton info', { error, jettonAddress });
            return null;
        }
    }

    /**
     * Get jettons for a specific address
     */
    async getAddressJettons(userAddress: string, offset: number = 0, limit: number = 50): Promise<AddressJetton[]> {
        try {
            if (!this.apiClient) {
                throw new JettonError('Api client not initialized', JettonErrorCode.NETWORK_ERROR);
            }

            const normalizedAddress = this.normalizeAddress(userAddress);
            log.debug('Getting address jettons', { userAddress: normalizedAddress, offset, limit });

            const response = await this.apiClient.jettonsByAddress({
                ownerAddress: normalizedAddress,
                offset,
                limit,
            });
            // const response = (await this.makeApiRequest(
            //     `/jetton/wallets?offset=${offset}&limit=${limit}&owner_address=${normalizedAddress}`,
            // )) as ToncenterResponseJettonWallets;

            if (!response.jetton_wallets) {
                return [];
            }

            const addressJettons: AddressJetton[] = [];

            for (const item of response.jetton_wallets) {
                try {
                    const jettonMetadata = response.metadata[item.jetton];
                    const metadataJettonInfo = jettonMetadata?.token_info?.find(
                        (info: unknown) =>
                            typeof info === 'object' &&
                            info !== null &&
                            'type' in info &&
                            (info as { type: string }).type === 'jetton_masters',
                    ) as EmulationTokenInfoMasters | undefined;

                    const jettonInfo: JettonInfo | null = metadataJettonInfo
                        ? {
                              address: normalizedAddress,
                              name: metadataJettonInfo.name,
                              symbol: metadataJettonInfo.symbol,
                              description: metadataJettonInfo.description,
                              image: metadataJettonInfo.image,
                              decimals:
                                  typeof metadataJettonInfo.extra.decimals === 'string'
                                      ? parseInt(metadataJettonInfo.extra.decimals, 10)
                                      : (metadataJettonInfo.extra.decimals as number),
                              image_data: metadataJettonInfo.extra.image_data,
                              uri: metadataJettonInfo.extra.uri,
                          }
                        : await this.getJettonInfo(item.jetton);
                    if (jettonInfo) {
                        const addressJetton: AddressJetton = {
                            address: item.jetton,
                            name: jettonInfo.name,
                            symbol: jettonInfo.symbol,
                            description: jettonInfo.description,
                            decimals: jettonInfo.decimals,
                            balance: item.balance,
                            jettonWalletAddress: item.address,
                            usdValue: '0',
                            image: jettonInfo.image,
                            verification: jettonInfo.verification,
                            metadata: jettonInfo.metadata,
                            totalSupply: jettonInfo.totalSupply,
                            uri: jettonInfo.uri,
                            image_data: jettonInfo.image_data,
                            // lastActivity: item.last_transaction_lt,
                        };
                        addressJettons.push(addressJetton);
                    }
                } catch (error) {
                    log.warn('Failed to get jetton info for address jetton', {
                        jettonAddress: item.jetton,
                        error,
                    });
                }
            }

            log.debug('Retrieved address jettons', { count: addressJettons.length });
            return addressJettons;
        } catch (error) {
            log.error('Failed to get address jettons', { error, userAddress });
            throw new JettonError(
                `Failed to get jettons for address: ${error instanceof Error ? error.message : 'Unknown error'}`,
                JettonErrorCode.NETWORK_ERROR,
                error,
            );
        }
    }

    /**
     * Add jetton info to cache from emulation data
     */
    addJettonFromEmulation(jettonAddress: string, emulationInfo: EmulationTokenInfoMasters): void {
        try {
            const normalizedAddress = this.normalizeAddress(jettonAddress);

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

            this.cache.set(normalizedAddress, jettonInfo);
            log.debug('Added jetton info from emulation to cache', {
                jettonAddress: normalizedAddress,
                name: jettonInfo.name,
                symbol: jettonInfo.symbol,
            });
        } catch (error) {
            log.error('Error adding jetton from emulation', { error, jettonAddress });
        }
    }

    /**
     * Add multiple jettons from emulation metadata
     */
    addJettonsFromEmulationMetadata(
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
                    log.debug('Adding jetton from emulation metadata', { jettonAddress });
                    this.addJettonFromEmulation(jettonAddress, jettonMasterInfo);
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                log.info('Added jettons from emulation metadata', { addedCount });
            }
        } catch (error) {
            log.error('Error adding jettons from emulation metadata', { error });
        }
    }

    /**
     * Normalize jetton address for consistent caching
     */
    private normalizeAddress(address: string): string {
        if (address === 'TON') {
            return 'TON';
        }
        // For now, just trim and convert to uppercase
        // In the future, we might want to use TON address normalization
        return Address.parse(address).toRawString().toLocaleUpperCase();
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
     * Clear the jetton cache
     */
    clearCache(): void {
        this.cache.clear();
        // Re-add TON
        this.cache.set('TON', {
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
        log.info('Jetton cache cleared');
    }
}
