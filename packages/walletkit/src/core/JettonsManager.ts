// Jettons API Manager - handles jetton information caching and retrieval

import { Address } from '@ton/core';
import { LRUCache } from 'lru-cache';

import type { EmulationTokenInfoMasters } from '../types/toncenter/emulation';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('JettonsManager');

/**
 * Jetton information interface
 */
export interface JettonInfo {
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
 * JettonsManager - manages jetton information with LRU caching
 */
export class JettonsManager {
    private cache: LRUCache<string, JettonInfo>;

    constructor(cacheSize: number = 10000) {
        this.cache = new LRUCache({
            max: cacheSize,
        });
        this.cache.set('TON', {
            address: 'TON',
            name: 'TON',
            symbol: 'TON',
            description: 'TON',
            image: 'https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/ee9fb21d17bc8d75c2a5f7b5f5f62d2bacec6b128f58b63cb841e98f7b74c4fc',
            decimals: 9,
        });

        log.info('JettonsManager initialized', { cacheSize });
    }

    /**
     * Get jetton information by address
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
     * Get jettons for a specific address (placeholder implementation)
     */
    getAddressJettons(userAddress: string, offset: number = 0, limit: number = 50): Promise<JettonInfo[]> {
        // TODO: Implement actual jetton retrieval for user address
        log.debug('getAddressJettons called (placeholder)', { userAddress, offset, limit });
        return Promise.resolve([]);
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
                extra: emulationInfo.extra,
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
     * Clear the jetton cache
     */
    clearCache(): void {
        this.cache.clear();
        log.info('Jetton cache cleared');
    }
}
