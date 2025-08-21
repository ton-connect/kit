// Transaction request handler

import type { WalletInterface, EventTransactionRequest, HumanReadableTx, TonNetwork } from '../types';
import type { RawBridgeEvent, RequestContext, EventHandler, RawBridgeEventGeneric } from '../types/internal';
import { isValidNanotonAmount, validateTransactionMessages } from '../validation/transaction';
import { logger } from '../core/Logger';

export class TransactionHandler implements EventHandler<EventTransactionRequest> {
    canHandle(event: RawBridgeEvent): boolean {
        return event.method === 'sendTransaction' || event.method === 'tonconnect_sendTransaction';
    }

    async handle(event: RawBridgeEvent, context: RequestContext): Promise<EventTransactionRequest> {
        const request = this.parseTransactionRequest(event);
        const preview = await this.createTransactionPreview(request, context.wallet);

        const txEvent: EventTransactionRequest = {
            id: event.id,
            request,
            preview,
            wallet: context.wallet || this.createPlaceholderWallet(),
        };

        return txEvent;
    }

    /**
     * Parse raw transaction request from bridge event
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseTransactionRequest(event: RawBridgeEventGeneric): any {
        const params = event.params || {};

        const request = {
            from: params.from || '',
            network: this.parseNetwork(params.network),
            validUntil: this.parseValidUntil(params.valid_until || params.validUntil),
            messages: this.parseMessages(params.messages || []),
        };

        // Validate messages
        const validation = validateTransactionMessages(request.messages);
        if (!validation.isValid) {
            throw new Error(`Invalid transaction messages: ${validation.errors.join(', ')}`);
        }

        return request;
    }

    /**
     * Parse network from various possible formats
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseNetwork(network: any): TonNetwork {
        if (typeof network === 'string') {
            return network.toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
        }
        if (typeof network === 'number') {
            // -239 for mainnet, -3 for testnet (common convention)
            return network === -3 ? 'testnet' : 'mainnet';
        }
        return 'mainnet'; // default
    }

    /**
     * Parse validUntil timestamp
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseValidUntil(validUntil: any): number {
        if (typeof validUntil === 'number') {
            return validUntil;
        }
        if (typeof validUntil === 'string') {
            const parsed = parseInt(validUntil, 10);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
        // Default to 10 minutes from now
        return Math.floor(Date.now() / 1000) + 600;
    }

    /**
     * Parse and validate messages array
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseMessages(messages: any[]): string[] {
        if (!Array.isArray(messages)) {
            throw new Error('Messages must be an array');
        }

        return messages.map((msg, index) => {
            if (typeof msg === 'string') {
                return msg; // Already a BOC string
            }
            if (typeof msg === 'object' && msg !== null) {
                // Convert object to BOC (this is a placeholder)
                // TODO: Implement proper message encoding
                return this.encodeMessageToBoc(msg);
            }
            throw new Error(`Invalid message at index ${index}`);
        });
    }

    /**
     * Create human-readable transaction preview
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async createTransactionPreview(request: any, wallet?: WalletInterface): Promise<any> {
        const humanReadableMessages = await Promise.all(
            request.messages.map((msg: string, index: number) => this.parseMessageToHumanReadable(msg, index)),
        );

        // TODO: Implement transaction emulation for fees and balance changes
        const emulationResult = await this.emulateTransaction(request, wallet);

        return {
            messages: humanReadableMessages,
            totalFees: emulationResult.totalFees,
            willBounce: emulationResult.willBounce,
            balanceBefore: emulationResult.balanceBefore,
            balanceAfter: emulationResult.balanceAfter,
        };
    }

    /**
     * Parse BOC message to human-readable format
     */
    private async parseMessageToHumanReadable(messageBoc: string, index: number): Promise<HumanReadableTx> {
        // TODO: Implement proper BOC parsing
        // This is a placeholder implementation

        try {
            // Mock parsing - replace with real BOC decoding
            const parsed: HumanReadableTx = {
                to: 'UQC...(parsed from BOC)',
                valueTON: '0.1',
                comment: 'Comment from BOC data',
                type: 'ton',
                extra: {
                    originalBoc: messageBoc,
                    index,
                },
            };

            return parsed;
        } catch (error) {
            logger.warn('Failed to parse message', { index, error });

            // Fallback to raw display
            return {
                to: 'Unknown (parsing failed)',
                valueTON: '0',
                type: 'raw',
                extra: {
                    originalBoc: messageBoc,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }

    /**
     * Emulate transaction to get fees and balance changes
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async emulateTransaction(request: any, wallet?: WalletInterface): Promise<any> {
        // TODO: Implement transaction emulation using TON API
        // This would involve calling a TON Center API or similar service

        let balanceBefore = '0';
        if (wallet) {
            try {
                balanceBefore = (await wallet.getBalance()).toString();
            } catch (error) {
                logger.warn('Failed to get wallet balance', { error });
            }
        }

        // Mock emulation result
        const totalFees = '5000000'; // 0.005 TON in nanotons
        const balanceAfter = isValidNanotonAmount(balanceBefore)
            ? (parseInt(balanceBefore, 10) - parseInt(totalFees, 10)).toString()
            : '0';

        return {
            totalFees,
            balanceBefore,
            balanceAfter,
            willBounce: false, // TODO: Determine from emulation
        };
    }

    /**
     * Encode message object to BOC string
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private encodeMessageToBoc(message: any): string {
        // TODO: Implement proper message encoding to BOC
        // This is a placeholder
        logger.warn('Message encoding not implemented, using placeholder BOC');
        return 'te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBYgIDAgLNBAUE';
    }

    /**
     * Create placeholder wallet
     */
    private createPlaceholderWallet(): WalletInterface {
        return {
            publicKey: new Uint8Array(0),
            version: '',
            sign: async () => new Uint8Array(0),
            getAddress: () => '',
            getBalance: async () => BigInt(0),
            getStateInit: async () => '',
        };
    }
}
