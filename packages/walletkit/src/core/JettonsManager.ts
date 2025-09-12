// Jettons API Manager - handles jetton information caching and retrieval

import { Address } from '@ton/core';
import { LRUCache } from 'lru-cache';

import type { EmulationTokenInfoMasters, ToncenterResponseJettonWallets } from '../types/toncenter/emulation';
import { globalLogger } from './Logger';
import { EventEmitter } from './EventEmitter';
import { CallForSuccess } from '../utils/retry';
import {
    JettonInfo,
    AddressJetton,
    JettonBalance,
    JettonTransfer,
    JettonTransaction,
    JettonPrice,
    JettonError,
    JettonErrorCode,
    JettonsAPI,
} from '../types/jettons';
import { ApiClient } from '../types/toncenter/ApiClient';

const log = globalLogger.createChild('JettonsManager');

/**
 * TonCenter API v3 response types
 */
interface TonCenterJettonInfo {
    jetton_content: {
        name: string;
        symbol: string;
        description: string;
        image?: string;
        decimals?: string;
        uri?: string;
    };
    total_supply: string;
    mintable: boolean;
    last_transaction_lt: string;
    code_hash: string;
    data_hash: string;
}

interface TonCenterJettonBalance {
    balance: string;
    wallet_address: string;
    jetton: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
    };
}

interface TonCenterJettonTransfer {
    transaction_hash: string;
    transaction_lt: string;
    transaction_now: number;
    source_wallet: string;
    destination_wallet: string;
    jetton_master: string;
    amount: string;
    comment?: string;
    successful: boolean;
}

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
    private readonly TONCENTER_V3_BASE = 'https://toncenter.com/api/v3';
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
            const normalizedAddress = this.normalizeAddress(userAddress);
            log.debug('Getting address jettons', { userAddress: normalizedAddress, offset, limit });

            const response = (await this.makeApiRequest(
                `/jetton/wallets?offset=${offset}&limit=${limit}&owner_address=${normalizedAddress}`,
            )) as ToncenterResponseJettonWallets;

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
     * Get user's jetton wallet address for a specific jetton
     */
    async getJettonWalletAddress(jettonMasterAddress: string, ownerAddress: string): Promise<string> {
        try {
            const normalizedJettonAddress = this.normalizeAddress(jettonMasterAddress);
            const normalizedOwnerAddress = this.normalizeAddress(ownerAddress);

            const response = (await this.makeApiRequest(
                `/jettons/${normalizedJettonAddress}/wallets/${normalizedOwnerAddress}`,
            )) as { address?: string };

            if (!response.address) {
                throw new JettonError('Jetton wallet address not found', JettonErrorCode.JETTON_NOT_FOUND);
            }

            return response.address;
        } catch (error) {
            if (error instanceof JettonError) {
                throw error;
            }
            log.error('Failed to get jetton wallet address', { error, jettonMasterAddress, ownerAddress });
            throw new JettonError(
                `Failed to get jetton wallet address: ${error instanceof Error ? error.message : 'Unknown error'}`,
                JettonErrorCode.NETWORK_ERROR,
                error,
            );
        }
    }

    /**
     * Get jetton balance for a specific jetton wallet
     */
    async getJettonBalance(jettonWalletAddress: string): Promise<JettonBalance> {
        try {
            const normalizedAddress = this.normalizeAddress(jettonWalletAddress);

            const response = (await this.makeApiRequest(
                `/jettonWallets/${normalizedAddress}`,
            )) as TonCenterJettonBalance;

            const balanceInfo = response;

            return {
                balance: balanceInfo.balance,
                jettonAddress: balanceInfo.jetton.address,
                jettonWalletAddress: normalizedAddress,
                lastUpdated: Date.now(),
            };
        } catch (error) {
            log.error('Failed to get jetton balance', { error, jettonWalletAddress });
            throw new JettonError(
                `Failed to get jetton balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
                JettonErrorCode.NETWORK_ERROR,
                error,
            );
        }
    }

    /**
     * Get jetton transfer history for an address
     */
    async getJettonTransfers(
        ownerAddress: string,
        jettonAddress?: string,
        limit: number = 50,
    ): Promise<JettonTransfer[]> {
        try {
            const normalizedOwnerAddress = this.normalizeAddress(ownerAddress);
            let endpoint = `/accounts/${normalizedOwnerAddress}/jettons/transfers?limit=${limit}`;

            if (jettonAddress) {
                const normalizedJettonAddress = this.normalizeAddress(jettonAddress);
                endpoint += `&jetton_master=${normalizedJettonAddress}`;
            }

            const response = (await this.makeApiRequest(endpoint)) as { transfers?: TonCenterJettonTransfer[] };

            if (!response.transfers) {
                return [];
            }

            const transfers: JettonTransfer[] = [];

            for (const transfer of response.transfers) {
                transfers.push({
                    hash: transfer.transaction_hash,
                    timestamp: transfer.transaction_now * 1000, // Convert to milliseconds
                    from: transfer.source_wallet,
                    to: transfer.destination_wallet,
                    jettonAddress: transfer.jetton_master,
                    amount: transfer.amount,
                    comment: transfer.comment,
                    successful: transfer.successful,
                });
            }

            return transfers;
        } catch (error) {
            log.error('Failed to get jetton transfers', { error, ownerAddress, jettonAddress });
            throw new JettonError(
                `Failed to get jetton transfers: ${error instanceof Error ? error.message : 'Unknown error'}`,
                JettonErrorCode.NETWORK_ERROR,
                error,
            );
        }
    }

    /**
     * Get detailed transaction info for jetton operation
     */
    async getJettonTransaction(transactionHash: string): Promise<JettonTransaction | null> {
        try {
            const response = (await this.makeApiRequest(`/transactions/${transactionHash}`)) as {
                now?: number;
                op_code?: string;
                success?: boolean;
                account?: string;
                jetton_master?: string;
                amount?: string;
                compute_fee?: string;
                storage_fee?: string;
                total_fees?: string;
                exit_code?: number;
            } | null;

            if (!response) {
                return null;
            }

            // This is a simplified implementation - TonCenter v3 transaction format may vary
            return {
                hash: transactionHash,
                timestamp: (response.now || 0) * 1000,
                type: response.op_code === '0xf8a7ea5' ? ('transfer' as const) : ('mint' as const),
                successful: response.success || false,
                participants: response.account ? [response.account] : [],
                jettonAddress: response.jetton_master || '',
                amount: response.amount,
                fees: {
                    gasFee: response.compute_fee || '0',
                    storageFee: response.storage_fee || '0',
                    total: response.total_fees || '0',
                },
                details: {
                    opcode: response.op_code,
                    exitCode: response.exit_code,
                    rawData: response,
                },
            };
        } catch (error) {
            log.error('Failed to get jetton transaction', { error, transactionHash });
            return null;
        }
    }

    /**
     * Search jettons by name or symbol
     */
    async searchJettons(query: string, limit: number = 20): Promise<JettonInfo[]> {
        try {
            // Note: This is a placeholder implementation as TonCenter v3 may not have search endpoint
            // In a real implementation, you might need a different search service or index
            log.debug('Searching jettons (placeholder)', { query, limit });

            // For now, return cached jettons that match the query
            const results: JettonInfo[] = [];

            for (const [_, jettonInfo] of this.cache.entries()) {
                if (
                    jettonInfo.name.toLowerCase().includes(query.toLowerCase()) ||
                    jettonInfo.symbol.toLowerCase().includes(query.toLowerCase())
                ) {
                    results.push(jettonInfo);
                    if (results.length >= limit) break;
                }
            }

            return results;
        } catch (error) {
            log.error('Failed to search jettons', { error, query });
            throw new JettonError(
                `Failed to search jettons: ${error instanceof Error ? error.message : 'Unknown error'}`,
                JettonErrorCode.NETWORK_ERROR,
                error,
            );
        }
    }

    /**
     * Get popular/trending jettons
     */
    async getPopularJettons(limit: number = 20): Promise<JettonInfo[]> {
        try {
            // Note: This is a placeholder implementation
            // In a real implementation, you might call a specific popular jettons endpoint
            log.debug('Getting popular jettons (placeholder)', { limit });

            const popularAddresses = [
                'EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqAk', // Example USDT
                'EQBX6K9aXVl3nXINCyPPL86C4ONVmQ8vK360u6dykFKXpHCX', // Example USDC
                // Add more popular jetton addresses
            ];

            const results: JettonInfo[] = [];

            for (const address of popularAddresses.slice(0, limit)) {
                try {
                    const jettonInfo = await this.getJettonInfo(address);
                    if (jettonInfo) {
                        results.push(jettonInfo);
                    }
                } catch (error) {
                    log.warn('Failed to get popular jetton info', { address, error });
                }
            }

            return results;
        } catch (error) {
            log.error('Failed to get popular jettons', { error });
            throw new JettonError(
                `Failed to get popular jettons: ${error instanceof Error ? error.message : 'Unknown error'}`,
                JettonErrorCode.NETWORK_ERROR,
                error,
            );
        }
    }

    /**
     * Get jetton price data
     */
    async getJettonPrice(jettonAddress: string): Promise<JettonPrice | null> {
        try {
            const normalizedAddress = this.normalizeAddress(jettonAddress);

            // Note: TonCenter v3 may not have price endpoints
            // This is a placeholder that returns null
            log.debug('Getting jetton price (placeholder)', { jettonAddress: normalizedAddress });

            return null;
        } catch (error) {
            log.error('Failed to get jetton price', { error, jettonAddress });
            return null;
        }
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
     * Check if address is a valid jetton master
     */
    async isJettonMaster(address: string): Promise<boolean> {
        try {
            const normalizedAddress = this.normalizeAddress(address);

            const response = await this.makeApiRequest(`/jettons/${normalizedAddress}`);

            // If we get jetton info back, it's a valid jetton master
            return !!(response as { jetton_content?: unknown }).jetton_content;
        } catch (error) {
            log.debug('Address is not a jetton master', { address, error });
            return false;
        }
    }

    /**
     * Make API request to TonCenter v3
     */
    private async makeApiRequest(endpoint: string): Promise<unknown> {
        const url = `${this.TONCENTER_V3_BASE}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // if (this.apiKey) {
        //     headers['X-API-Key'] = this.apiKey;
        // }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

        try {
            const response = await CallForSuccess(
                async () => {
                    const res = await fetch(url, {
                        method: 'GET',
                        headers,
                        signal: controller.signal,
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }

                    return res.json();
                },
                20,
                500,
            );

            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Enhanced getJettonInfo that tries API if not in cache
     */
    async getJettonInfoAsync(jettonAddress: string): Promise<JettonInfo | null> {
        try {
            const normalizedAddress = this.normalizeAddress(jettonAddress);

            // First check cache
            const cached = this.cache.get(normalizedAddress);
            if (cached) {
                return cached;
            }

            // Try to fetch from API
            const response = (await this.makeApiRequest(`/jettons/${normalizedAddress}`)) as TonCenterJettonInfo;

            if (response.jetton_content) {
                const jettonData = response;
                const jettonInfo: JettonInfo = {
                    address: normalizedAddress,
                    name: jettonData.jetton_content.name || '',
                    symbol: jettonData.jetton_content.symbol || '',
                    description: jettonData.jetton_content.description || '',
                    decimals: parseInt(jettonData.jetton_content.decimals || '9', 10),
                    totalSupply: jettonData.total_supply,
                    image: jettonData.jetton_content.image,
                    uri: jettonData.jetton_content.uri,
                    verification: {
                        verified: false,
                        source: 'toncenter' as const,
                    },
                };

                this.cache.set(normalizedAddress, jettonInfo);
                return jettonInfo;
            }

            return null;
        } catch (error) {
            log.debug('Failed to get jetton info from API', { error, jettonAddress });
            return null;
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
