/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionRpcResponseError, WalletResponseTemplateError } from '@tonconnect/protocol';
import { SEND_TRANSACTION_ERROR_CODES } from '@tonconnect/protocol';

import type { TonWalletKitOptions, ValidationResult } from '../types';
import type {
    RawBridgeEvent,
    EventHandler,
    RawBridgeEventSignMessage,
    RawBridgeEventTransaction,
} from '../types/internal';
import { globalLogger } from '../core/Logger';
import { BasicHandler } from './BasicHandler';
import type { EventEmitter } from '../core/EventEmitter';
import type { WalletKitEvents } from '../types/emitter';
import type { WalletManager } from '../core/WalletManager';
import type { Wallet } from '../api/interfaces';
import type { TransactionRequest, SignMessageRequestEvent } from '../api/models';
import type { Analytics, AnalyticsManager } from '../analytics';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import { createTransactionPreviewIfPossible } from '../utils';
import { checkTransactionRequestItems, getWalletFromEvent, parseTonConnectTransactionRequest } from '../utils/events';

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
        private readonly config: TonWalletKitOptions,
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
        const wallet = getWalletFromEvent(this.walletManager, event);
        if (!wallet) {
            log.error('Wallet not found', { event });
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

        const request = await checkTransactionRequestItems(requestValidation.result, wallet);
        const preview = await createTransactionPreviewIfPossible(this.config, wallet.client, request, wallet);

        const signMessageEvent: SignMessageRequestEvent = {
            ...event,
            request,
            preview: {
                data: preview,
            },
            dAppInfo: event.dAppInfo ?? {},
            walletId: wallet.getWalletId(),
            walletAddress: wallet.getAddress(),
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
        event: RawBridgeEventTransaction | RawBridgeEventSignMessage,
        wallet: Wallet,
    ): {
        result: TransactionRequest | undefined;
        validation: ValidationResult;
    } {
        return parseTonConnectTransactionRequest(event, wallet);
    }
}
