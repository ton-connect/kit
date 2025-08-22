// Transaction request handler

import { fromNano } from '@ton/core';

import type { WalletInterface, EventTransactionRequest, HumanReadableTx, TransactionPreview } from '../types';
import type {
    RawBridgeEvent,
    EventHandler,
    RawBridgeEventTransaction,
    ConnectTransactionParamContent,
    ValidationResult,
} from '../types/internal';
import { validateTransactionMessages } from '../validation/transaction';
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

const log = globalLogger.createChild('TransactionHandler');

// Callback for emulation results - allows external processing
export type EmulationResultCallback = (emulationResult: unknown) => void;

export class TransactionHandler
    extends BasicHandler<EventTransactionRequest>
    implements EventHandler<EventTransactionRequest, RawBridgeEventTransaction>
{
    private emulationResultCallback?: EmulationResultCallback;

    constructor(notify: (event: EventTransactionRequest) => void, emulationCallback?: EmulationResultCallback) {
        super(notify);
        this.emulationResultCallback = emulationCallback;
    }
    canHandle(event: RawBridgeEvent): event is RawBridgeEventTransaction {
        return event.method === 'sendTransaction';
    }

    async handle(event: RawBridgeEventTransaction): Promise<EventTransactionRequest> {
        if (!event.wallet) {
            log.error('Wallet not found', { event });
            throw new Error('Wallet not found');
        }

        const request = this.parseTransactionRequest(event);
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

    private parseTransactionRequest(event: RawBridgeEventTransaction): ConnectTransactionParamContent | undefined {
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

            const messagesValidation = validateTransactionMessages(params.messages);
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
        // throw new Error('Invalid validUntil timestamp');
        // if (typeof validUntil === 'string') {
        //     const parsed = parseInt(validUntil, 10);
        //     if (!isNaN(parsed)) {
        //         return parsed;
        //     }
        // }
        // // Default to 10 minutes from now
        // return Math.floor(Date.now() / 1000) + 600;
    }

    /**
     * Parse and validate messages array
     */

    // private parseMessages(messages: any[]): string[] {
    //     if (!Array.isArray(messages)) {
    //         throw new Error('Messages must be an array');
    //     }

    //     return messages.map((msg, index) => {
    //         if (typeof msg === 'string') {
    //             return msg; // Already a BOC string
    //         }
    //         if (typeof msg === 'object' && msg !== null) {
    //             // Convert object to BOC (this is a placeholder)
    //             // TODO: Implement proper message encoding
    //             return this.encodeMessageToBoc(msg);
    //         }
    //         throw new Error(`Invalid message at index ${index}`);
    //     });
    // }

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
        // TODO: Implement transaction emulation using TON API
        // This would involve calling a TON Center API or similar service

        const message = createToncenterMessage(wallet?.getAddress(), request.messages);
        const emulationResult = await CallForSuccess(() => fetchToncenterEmulation(message));

        const moneyFlow = processToncenterMoneyFlow(emulationResult);

        // Notify callback about emulation result for jetton caching
        if (this.emulationResultCallback && emulationResult.result) {
            try {
                this.emulationResultCallback(emulationResult.result);
            } catch (error) {
                log.warn('Error in emulation result callback', { error });
            }
        }

        return {
            emulationResult: emulationResult.result,
            moneyFlow,
        };

        // let balanceBefore = '0';
        // if (wallet) {
        //     try {
        //         balanceBefore = (await wallet.getBalance()).toString();
        //     } catch (error) {
        //         log.warn('Failed to get wallet balance', { error });
        //     }
        // }

        // // Mock emulation result
        // const totalFees = '5000000'; // 0.005 TON in nanotons
        // const balanceAfter = isValidNanotonAmount(balanceBefore)
        //     ? (parseInt(balanceBefore, 10) - parseInt(totalFees, 10)).toString()
        //     : '0';

        // return {
        //     totalFees,
        //     balanceBefore,
        //     balanceAfter,
        //     willBounce: false, // TODO: Determine from emulation
        // };
    }

    /**
     * Encode message object to BOC string
     */

    // private encodeMessageToBoc(message: any): string {
    //     // TODO: Implement proper message encoding to BOC
    //     // This is a placeholder
    //     log.warn('Message encoding not implemented, using placeholder BOC');
    //     return 'te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBYgIDAgLNBAUE';
    // }

    /**
     * Create placeholder wallet
     */
    // private createPlaceholderWallet(): WalletInterface {
    //     return {
    //         publicKey: new Uint8Array(0),
    //         version: '',
    //         sign: async () => new Uint8Array(0),
    //         getAddress: () => '',
    //         getBalance: async () => BigInt(0),
    //         getStateInit: async () => '',
    //     };
    // }
}
