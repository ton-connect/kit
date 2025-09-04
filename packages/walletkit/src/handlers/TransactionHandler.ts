import { fromNano } from '@ton/core';

import type { WalletInterface, EventTransactionRequest, HumanReadableTx, TransactionPreview } from '../types';
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
    MoneyFlow,
    processToncenterMoneyFlow,
} from '../utils/toncenterEmulation';
import { BasicHandler } from './BasicHandler';
import { CallForSuccess } from '../utils/retry';
import type { EventEmitter } from '../core/EventEmitter';

const log = globalLogger.createChild('TransactionHandler');

export class TransactionHandler
    extends BasicHandler<EventTransactionRequest>
    implements EventHandler<EventTransactionRequest, RawBridgeEventTransaction>
{
    private eventEmitter: EventEmitter;

    constructor(notify: (event: EventTransactionRequest) => void, eventEmitter: EventEmitter) {
        super(notify);
        this.eventEmitter = eventEmitter;
    }
    canHandle(event: RawBridgeEvent): event is RawBridgeEventTransaction {
        return event.method === 'sendTransaction';
    }

    async handle(event: RawBridgeEventTransaction): Promise<EventTransactionRequest> {
        if (!event.wallet) {
            log.error('Wallet not found', { event });
            throw new Error('Wallet not found');
        }

        const request = this.parseTonConnectTransactionRequest(event);
        if (!request) {
            log.error('Failed to parse transaction request', { event });
            throw new Error('Failed to parse transaction request');
        }

        const preview = await CallForSuccess(() => this.createTransactionPreview(request, event.wallet));

        const txEvent: EventTransactionRequest = {
            ...event,
            request,
            preview,
            wallet: event.wallet,
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

            const messagesValidation = validateTonConnectTransactionMessages(params.messages);
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

        return {
            // messages: [],
            moneyFlow: emulationResult.moneyFlow,
            emulationResult: emulationResult.emulationResult,

            // messages: humanReadableMessages,
            // totalFees: emulationResult.totalFees,
            // willBounce: emulationResult.willBounce,
            // balanceBefore: emulationResult.balanceBefore,
            // balanceAfter: emulationResult.balanceAfter,
        };
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
    ): Promise<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emulationResult: any;
        moneyFlow: MoneyFlow;
    }> {
        const message = createToncenterMessage(wallet?.getAddress(), request.messages);
        const emulationResult = await CallForSuccess(() => fetchToncenterEmulation(message));

        const moneyFlow = processToncenterMoneyFlow(emulationResult);

        // Emit emulation result event for jetton caching and other components
        if (emulationResult.result) {
            try {
                this.eventEmitter.emit('emulation:result', emulationResult.result);
            } catch (error) {
                log.warn('Error emitting emulation result event', { error });
            }
        }

        // TODO implement user wallet money flow
        return {
            emulationResult: emulationResult.result,
            moneyFlow,
        };
    }
}
