/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletResponseTemplateError } from '@tonconnect/protocol';
import { SEND_TRANSACTION_ERROR_CODES } from '@tonconnect/protocol';

import type { TonWalletKitOptions, ValidationResult } from '../types';
import { toTransactionRequest, parseConnectTransactionParamContent } from '../types/internal';
import type {
    RawBridgeEvent,
    EventHandler,
    RawBridgeEventSignMessage,
    RawConnectTransactionParamContent,
} from '../types/internal';
import { validateTransactionMessages as validateTonConnectTransactionMessages } from '../validation/transaction';
import { globalLogger } from '../core/Logger';
import { validateNetwork, validateFrom, validateValidUntil } from './transactionValidators';
import { BasicHandler } from './BasicHandler';
import type { EventEmitter } from '../core/EventEmitter';
import type { WalletKitEvents } from '../types/emitter';
import type { WalletManager } from '../core/WalletManager';
import { WalletKitError, ERROR_CODES } from '../errors';
import type { Wallet } from '../api/interfaces';
import type { TransactionRequest, SignMessageRequestEvent } from '../api/models';
import type { Analytics, AnalyticsManager } from '../analytics';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';

const log = globalLogger.createChild('SignMessageHandler');

// Error response shape (mirrors SendTransactionRpcResponseError but for signMessage)
interface SignMessageRpcResponseError {
    error: { code: number; message: string };
    id: string;
}

export class SignMessageHandler
    extends BasicHandler<SignMessageRequestEvent>
    implements EventHandler<SignMessageRequestEvent, RawBridgeEventSignMessage>
{
    private eventEmitter: EventEmitter<WalletKitEvents>;
    private analytics?: Analytics;

    constructor(
        notify: (event: SignMessageRequestEvent) => void,
        _config: TonWalletKitOptions,
        eventEmitter: EventEmitter<WalletKitEvents>,
        private readonly walletManager: WalletManager,
        private readonly sessionManager: TONConnectSessionManager,
        analyticsManager?: AnalyticsManager,
    ) {
        super(notify);
        this.eventEmitter = eventEmitter;
        this.sessionManager = sessionManager;
        this.analytics = analyticsManager?.scoped();
    }

    canHandle(event: RawBridgeEvent): event is RawBridgeEventSignMessage {
        return event.method === 'signMessage';
    }

    async handle(event: RawBridgeEventSignMessage): Promise<SignMessageRequestEvent | WalletResponseTemplateError> {
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
            } as SignMessageRpcResponseError;
        }

        const wallet = walletId ? this.walletManager.getWallet(walletId) : undefined;
        if (!wallet) {
            log.error('Wallet not found', { event, walletId, walletAddress });
            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Wallet not found',
                },
                id: event.id,
            } as SignMessageRpcResponseError;
        }

        const requestValidation = this.parseTonConnectTransactionRequest(event, wallet);
        if (!requestValidation.result || !requestValidation?.validation?.isValid) {
            log.error('Failed to parse sign message request', { event, requestValidation });
            this.eventEmitter.emit('eventError', event, 'sign-message-handler');
            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                    message: 'Failed to parse sign message request',
                },
                id: event.id,
            } as SignMessageRpcResponseError;
        }
        const request = requestValidation.result;

        const signMessageEvent: SignMessageRequestEvent = {
            ...event,
            request,
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
                origin_url: event.dAppInfo?.url,
            });
        }

        return signMessageEvent;
    }

    private parseTonConnectTransactionRequest(
        event: RawBridgeEventSignMessage,
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
                    'Invalid sign message request - expected exactly 1 parameter',
                    undefined,
                    { paramCount: event.params.length, eventId: event.id },
                );
            }
            const rawParams = JSON.parse(event.params[0]) as RawConnectTransactionParamContent;
            const params = parseConnectTransactionParamContent(rawParams);

            const validUntilValidation = validateValidUntil(params.validUntil);
            if (!validUntilValidation.isValid) {
                errors = errors.concat(validUntilValidation.errors);
            } else {
                params.validUntil = validUntilValidation.result;
            }

            const networkValidation = validateNetwork(params.network, wallet);
            if (!networkValidation.isValid) {
                errors = errors.concat(networkValidation.errors);
            } else {
                params.network = networkValidation.result;
            }

            const fromValidation = validateFrom(params.from, wallet);
            if (!fromValidation.isValid) {
                errors = errors.concat(fromValidation.errors);
            } else {
                params.from = fromValidation.result;
            }

            const isTonConnect = !event.isLocal;
            const messagesValidation = validateTonConnectTransactionMessages(params.messages, isTonConnect, false);
            if (!messagesValidation.isValid) {
                errors = errors.concat(messagesValidation.errors);
            }

            return {
                result: toTransactionRequest(params),
                validation: { isValid: errors.length === 0, errors: errors },
            };
        } catch (error) {
            log.error('Failed to parse sign message request', { error });
            errors.push('Failed to parse sign message request');
            return {
                result: undefined,
                validation: { isValid: errors.length === 0, errors: errors },
            };
        }
    }
}
