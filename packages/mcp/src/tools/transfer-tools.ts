/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { z } from 'zod';

import type { McpWalletService } from '../services/McpWalletService.js';
import { toRawAmount, TON_DECIMALS, toolError } from './types.js';
import type { ToolResponse } from './types.js';

export const tonTransferSchema = z.object({
    toAddress: z.string().min(1).describe('Recipient TON address'),
    amount: z.string().min(1).describe('Amount of GRAM (ex. TON) to send (e.g., "1.5" for 1.5 GRAM)'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

export const jettonTransferSchema = z.object({
    toAddress: z.string().min(1).describe('Recipient TON address'),
    jettonAddress: z.string().min(1).describe('Jetton master contract address'),
    amount: z.string().min(1).describe('Amount of tokens to send in human-readable format'),
    comment: z.string().optional().describe('Optional comment/memo for the transaction'),
});

const transactionMessageSchema = z.object({
    address: z.string().min(1).describe('Recipient wallet address'),
    amount: z.string().min(1).describe('Amount to transfer in nano units'),
    stateInit: z.string().optional().describe('Initial state for deploying a new contract (Base64)'),
    payload: z.string().optional().describe('Message payload data (Base64)'),
});

export const sendRawTransactionSchema = z.object({
    messages: z.array(transactionMessageSchema).min(1).describe('Array of messages to include in the transaction'),
    validUntil: z.number().optional().describe('Unix timestamp after which the transaction becomes invalid'),
    fromAddress: z.string().optional().describe('Sender wallet address'),
});

export const emulateTransactionSchema = z.object({
    messages: z.array(transactionMessageSchema).min(1).describe('Array of messages to include in the transaction'),
    validUntil: z.number().optional().describe('Unix timestamp after which the transaction becomes invalid'),
});

const PREPARED_TRANSACTION_NOTE =
    'Transaction prepared but NOT sent. Preview it with emulate_transaction, then broadcast with send_raw_transaction (which signs and sends).';

/** Resolves a human-readable jetton amount to raw units using the wallet's known jetton decimals. */
async function resolveJettonRawAmount(
    service: McpWalletService,
    jettonAddress: string,
    amount: string,
): Promise<{ rawAmount: string; symbol?: string } | { error: string }> {
    let decimals: number | undefined;
    let symbol: string | undefined;

    try {
        const jettons = await service.getJettons();
        const jetton = jettons.find((j) => j.address.toLowerCase() === jettonAddress.toLowerCase());
        if (jetton) {
            decimals = jetton.decimals;
            symbol = jetton.symbol;
        }
    } catch (error) {
        return { error: `Failed to fetch jetton info: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }

    if (decimals === undefined) {
        return { error: `Cannot determine decimals for jetton ${jettonAddress}. The token may not be in your wallet.` };
    }

    return { rawAmount: toRawAmount(amount, decimals), symbol };
}

export function createMcpTransferTools(service: McpWalletService) {
    return {
        build_ton_transfer: {
            description:
                'Prepare a GRAM (ex. TON) transfer from the wallet to an address. Amount is in GRAM (e.g., "1.5" means 1.5 GRAM). Does NOT broadcast: returns ready-to-send transaction messages. Preview them with emulate_transaction, then broadcast with send_raw_transaction.',
            inputSchema: tonTransferSchema,
            handler: async (args: z.infer<typeof tonTransferSchema>): Promise<ToolResponse> => {
                try {
                    const rawAmount = toRawAmount(args.amount, TON_DECIMALS);

                    const transaction = await service.buildTonTransferTransaction(
                        args.toAddress,
                        rawAmount,
                        args.comment,
                    );

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        details: {
                                            to: args.toAddress,
                                            amount: `${args.amount} GRAM`,
                                            comment: args.comment || null,
                                        },
                                        transaction,
                                        note: PREPARED_TRANSACTION_NOTE,
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                } catch (error) {
                    return toolError(error instanceof Error ? error.message : 'Unknown error');
                }
            },
        },

        build_jetton_transfer: {
            description:
                'Prepare a Jetton (token) transfer from the wallet to an address. Amount is in human-readable format. Does NOT broadcast: returns ready-to-send transaction messages. Preview them with emulate_transaction, then broadcast with send_raw_transaction.',
            inputSchema: jettonTransferSchema,
            handler: async (args: z.infer<typeof jettonTransferSchema>): Promise<ToolResponse> => {
                const resolved = await resolveJettonRawAmount(service, args.jettonAddress, args.amount);
                if ('error' in resolved) {
                    return toolError(resolved.error);
                }

                try {
                    const transaction = await service.buildJettonTransferTransaction(
                        args.toAddress,
                        args.jettonAddress,
                        resolved.rawAmount,
                        args.comment,
                    );

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        details: {
                                            to: args.toAddress,
                                            jettonAddress: args.jettonAddress,
                                            amount: `${args.amount} ${resolved.symbol || 'tokens'}`,
                                            comment: args.comment || null,
                                        },
                                        transaction,
                                        note: PREPARED_TRANSACTION_NOTE,
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                } catch (error) {
                    return toolError(error instanceof Error ? error.message : 'Unknown error');
                }
            },
        },

        send_raw_transaction: {
            description:
                'Send a raw transaction with full control over messages. Amounts are in nano units. Supports multiple messages. Returns normalizedHash. Default flow: poll get_transaction_status until completed or failed; user can skip.',
            inputSchema: sendRawTransactionSchema,
            handler: async (args: z.infer<typeof sendRawTransactionSchema>): Promise<ToolResponse> => {
                const result = await service.sendRawTransaction({
                    messages: args.messages,
                    validUntil: args.validUntil,
                    fromAddress: args.fromAddress,
                });

                if (!result.success) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: false,
                                    error: result.message,
                                }),
                            },
                        ],
                        isError: true,
                    };
                }

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    success: true,
                                    message: result.message,
                                    normalizedHash: result.normalizedHash,
                                    details: {
                                        messageCount: args.messages.length,
                                        messages: args.messages.map((m) => ({
                                            to: m.address,
                                            amount: `${m.amount} nano units`,
                                        })),
                                        normalizedHash: result.normalizedHash,
                                    },
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            },
        },
        emulate_transaction: {
            description:
                'Emulate a transaction without broadcasting it. Dry-run that returns the expected money flow (GRAM (ex. TON) and jetton balance changes) so you can verify a transaction before sending. Accepts the same messages format as send_raw_transaction.',
            inputSchema: emulateTransactionSchema,
            handler: async (args: z.infer<typeof emulateTransactionSchema>): Promise<ToolResponse> => {
                try {
                    const preview = await service.emulateTransaction({
                        messages: args.messages,
                        validUntil: args.validUntil,
                    });

                    const trace = preview?.trace;

                    // Sum total fees across all emulated transactions
                    let totalFees = 0n;
                    if (trace?.transactions) {
                        for (const tx of Object.values(trace?.transactions)) {
                            if (tx?.totalFees) {
                                totalFees += BigInt(tx.totalFees);
                            }
                        }
                    }

                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify(
                                    {
                                        success: preview?.result === 'success',
                                        totalFees: totalFees?.toString(),
                                        isIncomplete: trace?.isIncomplete ?? false,
                                        moneyFlow: preview?.moneyFlow
                                            ? {
                                                  tonOutputs: preview?.moneyFlow?.outputs,
                                                  tonInputs: preview?.moneyFlow?.inputs,
                                                  ourAddress: preview?.moneyFlow?.ourAddress,
                                                  ourTransfers: preview?.moneyFlow?.ourTransfers,
                                                  allJettonTransfers: preview?.moneyFlow.allJettonTransfers,
                                              }
                                            : null,
                                        actions: trace?.actions.map((a) => ({
                                            type: a?.details?.type,
                                            isSuccess: a?.isSuccess,
                                            accounts: a?.accounts,
                                            details: a?.details?.value,
                                        })),
                                        addressBook: trace?.addressBook ?? null,
                                    },
                                    null,
                                    2,
                                ),
                            },
                        ],
                    };
                } catch (error) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: JSON.stringify({
                                    success: false,
                                    error: error instanceof Error ? error.message : 'Unknown error',
                                }),
                            },
                        ],
                        isError: true,
                    };
                }
            },
        },
    };
}
