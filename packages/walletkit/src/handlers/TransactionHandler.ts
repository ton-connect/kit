/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import {
    CHAIN,
    SEND_TRANSACTION_ERROR_CODES,
    SendTransactionRpcResponseError,
    WalletResponseTemplateError,
} from '@tonconnect/protocol';

import type {
    IWallet,
    EventTransactionRequest,
    TransactionPreview,
    ToncenterEmulationResponse,
    ValidationResult,
    TonWalletKitOptions,
} from '../types';
import type {
    RawBridgeEvent,
    EventHandler,
    RawBridgeEventTransaction,
    ConnectTransactionParamContent,
} from '../types/internal';
import { validateTransactionMessages as validateTonConnectTransactionMessages } from '../validation/transaction';
import { globalLogger } from '../core/Logger';
import { isValidAddress } from '../utils/address';
import {
    createToncenterMessage,
    fetchToncenterEmulation,
    processToncenterMoneyFlow,
} from '../utils/toncenterEmulation';
import { BasicHandler } from './BasicHandler';
import { CallForSuccess } from '../utils/retry';
import type { EventEmitter } from '../core/EventEmitter';
import { WalletManager } from '../core/WalletManager';
import { TransactionPreviewEmulationError } from '../types/events';
import { ReturnWithValidationResult } from '../validation/types';
import { WalletKitError, ERROR_CODES } from '../errors';
import { AnalyticsApi } from '../analytics/sender';
import { getEventsSubsystem, getVersion } from '../utils/version';
import { uuidv7 } from '../utils/uuid';
import { getUnixtime } from '../utils/time';
import { Base64Normalize } from '../utils/base64';

const log = globalLogger.createChild('TransactionHandler');

export class TransactionHandler
    extends BasicHandler<EventTransactionRequest>
    implements EventHandler<EventTransactionRequest, RawBridgeEventTransaction>
{
    private eventEmitter: EventEmitter;
    private analyticsApi?: AnalyticsApi;
    private walletKitConfig: TonWalletKitOptions;

    constructor(
        notify: (event: EventTransactionRequest) => void,
        eventEmitter: EventEmitter,
        walletKitConfig: TonWalletKitOptions,
        private readonly walletManager: WalletManager,
        analyticsApi?: AnalyticsApi,
    ) {
        super(notify);
        this.eventEmitter = eventEmitter;
        this.analyticsApi = analyticsApi;
        this.walletKitConfig = walletKitConfig;
    }
    canHandle(event: RawBridgeEvent): event is RawBridgeEventTransaction {
        return event.method === 'sendTransaction';
    }

    async handle(event: RawBridgeEventTransaction): Promise<EventTransactionRequest | WalletResponseTemplateError> {
        if (!event.walletAddress) {
            log.error('Wallet address not found', { event });
            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Wallet address not found',
                },
                id: event.id,
            } as SendTransactionRpcResponseError;
        }

        const wallet = this.walletManager.getWallet(event.walletAddress);
        if (!wallet) {
            log.error('Wallet not found', { event });
            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Wallet address not found',
                },
                id: event.id,
            } as SendTransactionRpcResponseError;
        }

        const requestValidation = this.parseTonConnectTransactionRequest(event, wallet);
        if (!requestValidation.result || !requestValidation?.validation?.isValid) {
            log.error('Failed to parse transaction request', { event, requestValidation });
            this.eventEmitter.emit('event:error', event);

            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                    message: 'Failed to parse transaction request',
                },
                id: event.id,
            } as SendTransactionRpcResponseError;
        }
        const request = requestValidation.result;

        let preview: TransactionPreview;
        try {
            preview = await CallForSuccess(() => this.createTransactionPreview(request, wallet));
        } catch (error) {
            log.error('Failed to create transaction preview', { error });
            preview = {
                emulationError: {
                    code: ERROR_CODES.UNKNOWN_EMULATION_ERROR,
                    message: 'Unknown emulation error',
                },
                result: 'error',
            } as TransactionPreviewEmulationError;
        }

        const txEvent: EventTransactionRequest = {
            ...event,
            request,
            preview,
            dAppInfo: event.dAppInfo ?? {},
            walletAddress: event.walletAddress,
        };

        // Send wallet-transaction-request-received event
        this.analyticsApi?.sendEvents([
            {
                event_name: 'wallet-transaction-request-received',
                trace_id: event.traceId ?? uuidv7(),
                client_environment: 'wallet',
                subsystem: getEventsSubsystem(),
                client_id: event.from,

                client_timestamp: getUnixtime(),
                dapp_name: event.dAppInfo?.name,
                version: getVersion(),
                network_id: this.walletKitConfig.network,
                wallet_app_name: this.walletKitConfig.deviceInfo?.appName,
                wallet_app_version: this.walletKitConfig.deviceInfo?.appVersion,
                event_id: uuidv7(),
                // manifest_json_url: event.dAppInfo?.url, // todo
                origin_url: event.dAppInfo?.url,

                wallet_id: Base64Normalize(event.walletAddress),
            },
        ]);

        return txEvent;
    }

    /**
     * Parse raw transaction request from bridge event
     */

    private parseTonConnectTransactionRequest(
        event: RawBridgeEventTransaction,
        wallet: IWallet,
    ): {
        result: ConnectTransactionParamContent | undefined;
        validation: ValidationResult;
    } {
        let errors: string[] = [];
        try {
            if (event.params.length !== 1) {
                throw new WalletKitError(
                    ERROR_CODES.INVALID_REQUEST_EVENT,
                    'Invalid transaction request - expected exactly 1 parameter',
                    undefined,
                    { paramCount: event.params.length, eventId: event.id },
                );
            }
            const params = JSON.parse(event.params[0]) as ConnectTransactionParamContent;

            const validUntilValidation = this.validateValidUntil(params.valid_until);
            if (!validUntilValidation.isValid) {
                errors = errors.concat(validUntilValidation.errors);
            } else {
                params.valid_until = validUntilValidation.result;
            }

            const networkValidation = this.validateNetwork(params.network, wallet);
            if (!networkValidation.isValid) {
                errors = errors.concat(networkValidation.errors);
            } else {
                params.network = networkValidation.result;
            }

            const fromValidation = this.validateFrom(params.from, wallet);
            if (!fromValidation.isValid) {
                errors = errors.concat(fromValidation.errors);
            } else {
                params.from = fromValidation.result;
            }

            const isTonConnect = !event.isLocal;
            const messagesValidation = validateTonConnectTransactionMessages(params.messages, isTonConnect);
            if (!messagesValidation.isValid) {
                errors = errors.concat(messagesValidation.errors);
            }

            return {
                result: params,
                validation: { isValid: errors.length === 0, errors: errors },
            };
        } catch (error) {
            log.error('Failed to parse transaction request', { error });
            errors.push('Failed to parse transaction request');
            return {
                result: undefined,
                validation: { isValid: errors.length === 0, errors: errors },
            };
        }
    }

    /**
     * Parse network from various possible formats
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private validateNetwork(network: any, wallet: IWallet): ReturnWithValidationResult<CHAIN | undefined> {
        let errors: string[] = [];
        if (typeof network === 'string') {
            if (network === '-3' || network === '-239') {
                const chain = network === '-3' ? CHAIN.TESTNET : CHAIN.MAINNET;
                const walletNetwork = wallet.getNetwork();
                if (chain !== walletNetwork) {
                    errors.push('Invalid network not equal to wallet network');
                } else {
                    return { result: chain, isValid: errors.length === 0, errors: errors };
                }
            } else {
                errors.push('Invalid network not a valid network');
            }
        } else {
            errors.push('Invalid network not a string');
        }

        return { result: undefined, isValid: errors.length === 0, errors: errors };
    }

    private validateFrom(from: unknown, wallet: IWallet): ReturnWithValidationResult<string> {
        let errors: string[] = [];

        if (typeof from !== 'string') {
            errors.push('Invalid from address not a string');
            return { result: '', isValid: errors.length === 0, errors: errors };
        }

        if (!isValidAddress(from)) {
            errors.push('Invalid from address');
            return { result: '', isValid: errors.length === 0, errors: errors };
        }

        const fromAddress = Address.parse(from);
        const walletAddress = Address.parse(wallet.getAddress());
        if (!fromAddress.equals(walletAddress)) {
            errors.push('Invalid from address not equal to wallet address');
            return { result: '', isValid: errors.length === 0, errors: errors };
        }

        return { result: from, isValid: errors.length === 0, errors: errors };
    }

    /**
     * Parse validUntil timestamp
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private validateValidUntil(validUntil: any): ReturnWithValidationResult<number> {
        let errors: string[] = [];
        if (typeof validUntil === 'undefined') {
            return { result: 0, isValid: errors.length === 0, errors: errors };
        }
        if (typeof validUntil !== 'number' || isNaN(validUntil)) {
            errors.push('Invalid validUntil timestamp not a number');
            return { result: 0, isValid: errors.length === 0, errors: errors };
        }

        const now = Math.floor(Date.now() / 1000);
        if (validUntil < now) {
            errors.push('Invalid validUntil timestamp');
            return { result: 0, isValid: errors.length === 0, errors: errors };
        }

        return { result: validUntil, isValid: errors.length === 0, errors: errors };
    }

    /**
     * Create human-readable transaction preview
     */

    private async createTransactionPreview(
        request: ConnectTransactionParamContent,
        wallet?: IWallet,
    ): Promise<TransactionPreview> {
        const emulationResult = await this.emulateTransaction(request, wallet);
        log.info('Emulation result', { emulationResult });

        return emulationResult;
    }

    /**
     * Emulate transaction to get fees and balance changes
     */

    private async emulateTransaction(
        request: ConnectTransactionParamContent,
        wallet?: IWallet,
    ): Promise<TransactionPreview> {
        const message = createToncenterMessage(wallet?.getAddress(), request.messages);

        let emulationResult: ToncenterEmulationResponse;
        try {
            const emulatedResult = await CallForSuccess(() => fetchToncenterEmulation(message));
            if (emulatedResult.result === 'success') {
                emulationResult = emulatedResult.emulationResult;
            } else {
                return emulatedResult;
            }
        } catch (_error) {
            return {
                result: 'error',
                emulationError: {
                    code: ERROR_CODES.UNKNOWN_EMULATION_ERROR,
                    message: 'Unknown emulation error',
                },
            };
        }

        const moneyFlow = processToncenterMoneyFlow(emulationResult);

        // Emit emulation result event for jetton caching and other components
        if (emulationResult) {
            try {
                this.eventEmitter.emit('emulation:result', emulationResult);
            } catch (error) {
                log.warn('Error emitting emulation result event', { error });
            }
        }

        // TODO implement user wallet money flow
        return {
            result: 'success',
            emulationResult: emulationResult,
            moneyFlow,
        };
    }
}
