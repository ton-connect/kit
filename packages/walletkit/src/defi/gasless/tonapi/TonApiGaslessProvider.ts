/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { TonApiClient } from '@ton-api/client';

import { Network } from '../../../api/models';
import type {
    GaslessConfig,
    GaslessEstimateParams,
    GaslessEstimateResult,
    GaslessSendParams,
} from '../../../api/models';
import { globalLogger } from '../../../core/Logger';
import { CallForSuccess } from '../../../utils/retry';
import { GaslessError } from '../errors';
import { GaslessProvider } from '../GaslessProvider';
import { buildInternalMessageCell, cellToBase64, internalBocToExternalMessageBoc, stripHexPrefix } from './utils';

const log = globalLogger.createChild('TonApiGaslessProvider');

/**
 * Configuration for TonApiGaslessProvider.
 */
export interface TonApiGaslessProviderConfig {
    /** Pre-configured TonApi client (brings its own baseUrl / API key). */
    client: TonApiClient;
    /** Optional provider id override. Defaults to 'tonapi'. */
    providerId?: string;
    /** Number of send retries on transient errors. Defaults to 5. */
    sendRetries?: number;
    /** Delay between send retries in ms. Defaults to 2000. */
    sendRetryDelayMs?: number;
}

/**
 * Gasless provider implementation backed by TonApi (@ton-api/client).
 *
 * Follows the public gasless flow documented at
 * https://docs.tonapi.io/tonapi/rest-api/gasless.
 *
 * @example
 * ```typescript
 * import { TonApiClient } from '@ton-api/client';
 * import { TonApiGaslessProvider } from '@ton/walletkit/gasless/tonapi';
 *
 * const provider = new TonApiGaslessProvider({
 *     client: new TonApiClient({ baseUrl: 'https://tonapi.io' }),
 * });
 *
 * kit.registerProvider(provider);
 * ```
 */
export class TonApiGaslessProvider extends GaslessProvider {
    readonly providerId: string;

    private readonly client: TonApiClient;
    private readonly sendRetries: number;
    private readonly sendRetryDelayMs: number;

    constructor(config: TonApiGaslessProviderConfig) {
        super();
        this.client = config.client;
        this.providerId = config.providerId ?? 'tonapi';
        this.sendRetries = config.sendRetries ?? 5;
        this.sendRetryDelayMs = config.sendRetryDelayMs ?? 2000;
    }

    async getConfig(): Promise<GaslessConfig> {
        try {
            const cfg = await this.client.gasless.gaslessConfig();
            return {
                relayAddress: cfg.relayAddress.toString({ bounceable: true }),
                supportedGasJettons: cfg.gasJettons.map((jetton) => ({
                    jettonMaster: jetton.masterId.toString({ bounceable: true }),
                })),
            };
        } catch (error) {
            log.error('Failed to fetch gasless config', { error });
            throw new GaslessError(
                error instanceof Error ? error.message : 'Failed to fetch gasless config',
                GaslessError.CONFIG_FAILED,
                error,
            );
        }
    }

    async estimate(params: GaslessEstimateParams): Promise<GaslessEstimateResult> {
        const feeJettonMaster = Address.parse(params.feeJettonMaster);
        const walletAddress = Address.parse(params.walletAddress);
        const walletPublicKey = stripHexPrefix(params.walletPublicKey);

        const messagesBoc = params.messages.map((message) => ({
            boc: buildInternalMessageCell(message),
        }));

        try {
            const result = await this.client.gasless.gaslessEstimate(feeJettonMaster, {
                walletAddress,
                walletPublicKey,
                messages: messagesBoc,
            });

            return {
                messages: result.messages.map((message) => ({
                    address: message.address.toString({ bounceable: true }),
                    amount: message.amount,
                    payload: message.payload ? cellToBase64(message.payload) : undefined,
                    stateInit: message.stateInit ? cellToBase64(message.stateInit) : undefined,
                })),
                fee: result.commission.toString(),
                validUntil: result.validUntil,
                relayAddress: result.relayAddress.toString({ bounceable: true }),
                from: result.from.toString({ bounceable: true }),
            };
        } catch (error) {
            log.error('Failed to estimate gasless transaction', { error, params });
            throw new GaslessError(
                error instanceof Error ? error.message : 'Failed to estimate gasless transaction',
                GaslessError.ESTIMATE_FAILED,
                error,
            );
        }
    }

    async send(params: GaslessSendParams): Promise<void> {
        const walletPublicKey = stripHexPrefix(params.walletPublicKey);
        const externalBoc = internalBocToExternalMessageBoc(params.internalBoc);

        try {
            await CallForSuccess(
                () =>
                    this.client.gasless.gaslessSend({
                        walletPublicKey,
                        boc: externalBoc,
                    }),
                this.sendRetries,
                this.sendRetryDelayMs,
            );
        } catch (error) {
            log.error('Failed to send gasless transaction', { error });
            throw new GaslessError(
                error instanceof Error ? error.message : 'Failed to send gasless transaction',
                GaslessError.SEND_FAILED,
                error,
            );
        }
    }

    getSupportedNetworks(): Network[] {
        return [Network.mainnet()];
    }
}
