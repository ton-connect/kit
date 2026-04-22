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
    RawBridgeEventTransaction,
    RawBridgeEventSignMessage,
} from '../types/internal';
import { globalLogger } from '../core/Logger';
import { createTransactionPreviewIfPossible } from '../utils/toncenterEmulation';
import { BasicHandler } from './BasicHandler';
import type { WalletKitEventEmitter } from '../types/emitter';
import type { WalletManager } from '../core/WalletManager';
import type { Wallet } from '../api/interfaces';
import type { TransactionRequest, SendTransactionRequestEvent } from '../api/models';
import type { Analytics, AnalyticsManager } from '../analytics';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import { checkTransactionRequestItems, getWalletFromEvent, parseTonConnectTransactionRequest } from '../utils/events';

const log = globalLogger.createChild('TransactionHandler');

export class TransactionHandler
    extends BasicHandler<SendTransactionRequestEvent>
    implements EventHandler<SendTransactionRequestEvent, RawBridgeEventTransaction>
{
    private eventEmitter: WalletKitEventEmitter;
    private analytics?: Analytics;

    constructor(
        notify: (event: SendTransactionRequestEvent) => void,
        private readonly config: TonWalletKitOptions,
        eventEmitter: WalletKitEventEmitter,
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
            log.error('Failed to parse transaction request', { event, requestValidation });
            this.eventEmitter.emit('eventError', event, 'transaction-handler');

            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                    message: 'Failed to parse transaction request',
                },
                id: event.id,
            } as SendTransactionRpcResponseError;
        }

        const request = await checkTransactionRequestItems(requestValidation.result, wallet);
        const preview = await createTransactionPreviewIfPossible(this.config, wallet.client, request, wallet);

        const txEvent: SendTransactionRequestEvent = {
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
        event: RawBridgeEventTransaction | RawBridgeEventSignMessage,
        wallet: Wallet,
    ): {
        result: TransactionRequest | undefined;
        validation: ValidationResult;
    } {
        return parseTonConnectTransactionRequest(event, wallet);
    }
}
