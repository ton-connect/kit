import { fromNano } from '@ton/core';
import {
    SEND_TRANSACTION_ERROR_CODES,
    SendTransactionRpcResponseError,
    WalletResponseTemplateError,
} from '@tonconnect/protocol';

import type {
    WalletInterface,
    EventTransactionRequest,
    HumanReadableTx,
    TransactionPreview,
    ToncenterEmulationResponse,
} from '../types';
import type {
    RawBridgeEvent,
    EventHandler,
    RawBridgeEventTransaction,
    ConnectTransactionParamContent,
    ValidationResult,
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
import { EmulationErrorUnknown } from '../types/emulation/errors';
import { WalletManager } from '../core/WalletManager';
import { TransactionPreviewEmulationError } from '../types/events';

const log = globalLogger.createChild('TransactionHandler');

export class TransactionHandler
    extends BasicHandler<EventTransactionRequest>
    implements EventHandler<EventTransactionRequest, RawBridgeEventTransaction>
{
    private eventEmitter: EventEmitter;

    constructor(
        notify: (event: EventTransactionRequest) => void,
        eventEmitter: EventEmitter,
        private readonly walletManager: WalletManager,
    ) {
        super(notify);
        this.eventEmitter = eventEmitter;
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

        const request = this.parseTonConnectTransactionRequest(event);
        if (!request) {
            log.error('Failed to parse transaction request', { event });
            this.eventEmitter.emit('event:error', event);

            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                    message: 'Failed to parse transaction request',
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

        let preview: TransactionPreview;
        try {
            preview = await CallForSuccess(() => this.createTransactionPreview(request, wallet));
        } catch (error) {
            log.error('Failed to create transaction preview', { error });
            preview = {
                emulationError: new EmulationErrorUnknown('Unknown emulation error', error),
                result: 'error',
            } as TransactionPreviewEmulationError;
        }

        const txEvent: EventTransactionRequest = {
            ...event,
            request,
            preview,
            walletAddress: event.walletAddress,
        };

        return txEvent;
    }

    /**
     * Parse raw transaction request from bridge event
     */

    private parseTonConnectTransactionRequest(
        event: RawBridgeEventTransaction,
    ): ConnectTransactionParamContent | undefined {
        try {
            if (event.params.length !== 1) {
                throw new Error('Invalid transaction request');
            }
            const params = JSON.parse(event.params[0]) as ConnectTransactionParamContent;

            const validUntilValidation = this.validateValidUntil(params.valid_until);
            if (!validUntilValidation.isValid) {
                throw new Error(`Invalid validUntil timestamp: ${validUntilValidation.errors.join(', ')}`);
            }

            const networkValidation = this.validateNetwork(params.network);
            if (!networkValidation.isValid) {
                throw new Error(`Invalid network: ${networkValidation.errors.join(', ')}`);
            }

            const fromValidation = this.validateFrom(params.from);
            if (!fromValidation.isValid) {
                throw new Error(`Invalid from address: ${fromValidation.errors.join(', ')}`);
            }

            const isTonConnect = !event.isLocal;
            const messagesValidation = validateTonConnectTransactionMessages(params.messages, isTonConnect);
            if (!messagesValidation.isValid) {
                throw new Error(`Invalid transaction messages: ${messagesValidation.errors.join(', ')}`);
            }

            return params;
        } catch (error) {
            log.error('Failed to parse transaction request', { error });
            return undefined;
        }
    }

    /**
     * Parse network from various possible formats
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private validateNetwork(network: any): ValidationResult {
        if (typeof network === 'string') {
            if (network === '-3' || network === '-239') {
                return { isValid: true, errors: [] };
            }
        }

        return { isValid: false, errors: ['Invalid network'] };
        // if (typeof network === 'number') {
        //     // -239 for mainnet, -3 for testnet (common convention)
        //     return { isValid: true, errors: [] };
        // }
        // return { isValid: false, errors: ['Invalid network'] };
    }

    private validateFrom(from: unknown): ValidationResult {
        if (typeof from !== 'string') {
            return { isValid: false, errors: ['Invalid from address'] };
        }

        if (isValidAddress(from)) {
            return { isValid: true, errors: [] };
        }

        return { isValid: false, errors: ['Invalid from address'] };
    }

    /**
     * Parse validUntil timestamp
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private validateValidUntil(validUntil: any): ValidationResult {
        if (typeof validUntil === 'undefined') {
            return { isValid: true, errors: [] };
        }
        if (typeof validUntil === 'number' && !isNaN(validUntil)) {
            return { isValid: true, errors: [] };
        }

        return { isValid: false, errors: ['Invalid validUntil timestamp'] };
    }

    /**
     * Create human-readable transaction preview
     */

    private async createTransactionPreview(
        request: ConnectTransactionParamContent,
        wallet?: WalletInterface,
    ): Promise<TransactionPreview> {
        // const humanReadableMessages = await Promise.all(
        //     request.messages.map((msg, index: number) => this.parseMessageToHumanReadable(msg, index)),
        // );

        // TODO: Implement transaction emulation for fees and balance changes
        const emulationResult = await this.emulateTransaction(request, wallet);
        log.info('Emulation result', { emulationResult });

        return emulationResult;
    }

    /**
     * Parse BOC message to human-readable format
     */
    private async parseMessageToHumanReadable(
        message: ConnectTransactionParamContent['messages'][number],
        index: number,
    ): Promise<HumanReadableTx> {
        // TODO: Implement proper BOC parsing
        // This is a placeholder implementation

        try {
            // Mock parsing - replace with real BOC decoding
            const parsed: HumanReadableTx = {
                to: message.address,
                valueTON: fromNano(message.amount).toString(),
                // comment: 'Comment from BOC data',
                type: 'ton',
                extra: {
                    // originalBoc: messageBoc,
                    index,
                },
            };

            return parsed;
        } catch (error) {
            log.warn('Failed to parse message', { index, error });

            // Fallback to raw display
            return {
                to: 'Unknown (parsing failed)',
                valueTON: '0',
                type: 'raw',
                extra: {
                    // originalBoc: message,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }

    /**
     * Emulate transaction to get fees and balance changes
     */

    private async emulateTransaction(
        request: ConnectTransactionParamContent,
        wallet?: WalletInterface,
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
        } catch (error) {
            return {
                result: 'error',
                emulationError: new EmulationErrorUnknown('Unknown emulation error', error),
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
