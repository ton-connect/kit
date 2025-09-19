import { Address } from '@ton/core';
import {
    CHAIN,
    SEND_TRANSACTION_ERROR_CODES,
    SendTransactionRpcResponseError,
    WalletResponseTemplateError,
} from '@tonconnect/protocol';

import type {
    WalletInterface,
    EventTransactionRequest,
    TransactionPreview,
    ToncenterEmulationResponse,
    ValidationResult,
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
import { EmulationErrorUnknown } from '../types/emulation/errors';
import { WalletManager } from '../core/WalletManager';
import { TransactionPreviewEmulationError } from '../types/events';
import { ReturnWithValidationResult } from '../validation/types';
import { WalletKitError, ERROR_CODES } from '../errors';

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
        wallet: WalletInterface,
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
    private validateNetwork(network: any, wallet: WalletInterface): ReturnWithValidationResult<CHAIN | undefined> {
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

    private validateFrom(from: unknown, wallet: WalletInterface): ReturnWithValidationResult<string> {
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
        wallet?: WalletInterface,
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
