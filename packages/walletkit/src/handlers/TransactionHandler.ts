/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { SendTransactionRpcResponseError, WalletResponseTemplateError } from '@tonconnect/protocol';
import { CHAIN, SEND_TRANSACTION_ERROR_CODES } from '@tonconnect/protocol';

import type { TonWalletKitOptions, ValidationResult } from '../types';
import { toTransactionRequest, parseConnectTransactionParamContent } from '../types/internal';
import type {
    RawBridgeEvent,
    EventHandler,
    RawBridgeEventTransaction,
    RawConnectTransactionParamContent,
} from '../types/internal';
import { validateTransactionMessages as validateTonConnectTransactionMessages } from '../validation/transaction';
import { globalLogger } from '../core/Logger';
import { isValidAddress } from '../utils/address';
import { createTransactionPreview as createTransactionPreviewHelper } from '../utils/toncenterEmulation';
import { BasicHandler } from './BasicHandler';
import { CallForSuccess } from '../utils/retry';
import type { EventEmitter } from '../core/EventEmitter';
import type { WalletManager } from '../core/WalletManager';
import type { ReturnWithValidationResult } from '../validation/types';
import { WalletKitError, ERROR_CODES } from '../errors';
import type { Wallet } from '../api/interfaces';
import type { TransactionEmulatedPreview, TransactionRequest, SendTransactionRequestEvent } from '../api/models';
import { Result } from '../api/models';
import type { Analytics, AnalyticsManager } from '../analytics';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';

const log = globalLogger.createChild('TransactionHandler');

export class TransactionHandler
    extends BasicHandler<SendTransactionRequestEvent>
    implements EventHandler<SendTransactionRequestEvent, RawBridgeEventTransaction>
{
    private eventEmitter: EventEmitter;
    private analytics?: Analytics;

    constructor(
        notify: (event: SendTransactionRequestEvent) => void,
        private readonly config: TonWalletKitOptions,
        eventEmitter: EventEmitter,
        private readonly walletManager: WalletManager,
        private readonly sessionManager: TONConnectSessionManager,
        analyticsManager?: AnalyticsManager,
    ) {
        super(notify);
        this.eventEmitter = eventEmitter;
        this.sessionManager = sessionManager;
        this.analytics = analyticsManager?.scoped();
    }
    canHandle(event: RawBridgeEvent): event is RawBridgeEventTransaction {
        return event.method === 'sendTransaction';
    }

    async handle(event: RawBridgeEventTransaction): Promise<SendTransactionRequestEvent | WalletResponseTemplateError> {
        // Support both walletId (new) and walletAddress (legacy)
        const walletId = event.walletId;
        const walletAddress = event.walletAddress;

        if (!walletId && !walletAddress) {
            log.error('Wallet ID not found', { event });
            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Wallet ID not found',
                },
                id: event.id,
            } as SendTransactionRpcResponseError;
        }

        // Try to get wallet by walletId first, fall back to address search
        const wallet = walletId ? this.walletManager.getWallet(walletId) : undefined;
        if (!wallet) {
            log.error('Wallet not found', { event, walletId, walletAddress });
            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Wallet not found',
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

        let preview: TransactionEmulatedPreview | undefined;
        if (!this.config.eventProcessor?.disableTransactionEmulation) {
            try {
                preview = await CallForSuccess(() => createTransactionPreviewHelper(wallet.client, request, wallet));
                // Emit emulation result event for jetton caching and other components
                if (preview.result === Result.success && preview.trace) {
                    try {
                        this.eventEmitter.emit('emulation:result', preview.trace);
                    } catch (error) {
                        log.warn('Error emitting emulation result event', { error });
                    }
                }
            } catch (error) {
                log.error('Failed to create transaction preview', { error });
                preview = {
                    error: {
                        code: ERROR_CODES.UNKNOWN_EMULATION_ERROR,
                        message: 'Unknown emulation error',
                    },
                    result: Result.failure,
                };
            }
        }

        const txEvent: SendTransactionRequestEvent = {
            ...event,
            request,
            preview: {
                data: preview,
            },
            dAppInfo: event.dAppInfo ?? {},
            walletId: walletId ?? this.walletManager.getWalletId(wallet),
            walletAddress: walletAddress ?? wallet.getAddress(),
        };

        if (this.analytics) {
            const sessionData = event.from ? await this.sessionManager.getSession(event.from) : undefined;

            this.analytics?.emitWalletTransactionRequestReceived({
                trace_id: event.traceId,
                client_id: event.from,
                wallet_id: sessionData?.publicKey,

                dapp_name: event.dAppInfo?.name,
                network_id: wallet.getNetwork().chainId,
                // manifest_json_url: event.dAppInfo?.url, // todo
                origin_url: event.dAppInfo?.url,
            });
        }

        return txEvent;
    }

    /**
     * Parse raw transaction request from bridge event
     */

    private parseTonConnectTransactionRequest(
        event: RawBridgeEventTransaction,
        wallet: Wallet,
    ): {
        result: TransactionRequest | undefined;
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
            const rawParams = JSON.parse(event.params[0]) as RawConnectTransactionParamContent;
            const params = parseConnectTransactionParamContent(rawParams);

            const validUntilValidation = this.validateValidUntil(params.validUntil);
            if (!validUntilValidation.isValid) {
                errors = errors.concat(validUntilValidation.errors);
            } else {
                params.validUntil = validUntilValidation.result;
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
                result: toTransactionRequest(params),
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
    private validateNetwork(network: any, wallet: Wallet): ReturnWithValidationResult<CHAIN | undefined> {
        let errors: string[] = [];
        if (typeof network === 'string') {
            if (network === '-3' || network === '-239') {
                const chain = network === '-3' ? CHAIN.TESTNET : CHAIN.MAINNET;
                const walletNetwork = wallet.getNetwork();
                if (chain !== walletNetwork.chainId) {
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

    private validateFrom(from: unknown, wallet: Wallet): ReturnWithValidationResult<string> {
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
}
