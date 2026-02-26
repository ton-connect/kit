/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CliWalletService } from '../services/CliWalletService.js';
import { successHeader, keyValue, printResult, printError } from '../utils/output.js';
import { withSpinner } from '../utils/spinner.js';

const TON_DECIMALS = 9;

function toRawAmount(amount: string, decimals: number): string {
    const [intPart, fracPart = ''] = amount.split('.');
    const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
    const raw = (intPart + paddedFrac).replace(/^0+/, '') || '0';
    return raw;
}

export async function sendTonCommand(
    service: CliWalletService,
    toAddress: string,
    amount: string,
    comment: string | undefined,
    jsonMode: boolean,
): Promise<void> {
    try {
        const rawAmount = toRawAmount(amount, TON_DECIMALS);

        const result = await withSpinner(`Sending ${amount} TON...`, () =>
            service.sendTon(toAddress, rawAmount, comment),
        );

        if (!result.success) {
            printError(jsonMode, result.message);
            return;
        }

        const data = {
            success: true,
            message: result.message,
            details: {
                to: toAddress,
                amount: `${amount} TON`,
                comment: comment || null,
            },
        };

        const human =
            successHeader('Transfer Sent') +
            keyValue([
                ['To', toAddress],
                ['Amount', `${amount} TON`],
                ['Comment', comment],
                ['Status', 'success'],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}

export async function sendJettonCommand(
    service: CliWalletService,
    toAddress: string,
    jettonAddress: string,
    amount: string,
    comment: string | undefined,
    jsonMode: boolean,
): Promise<void> {
    try {
        let decimals: number | undefined;
        let symbol: string | undefined;

        try {
            const jettons = await service.getJettons();
            const jetton = jettons.find((j) => j.address.toLowerCase() === jettonAddress.toLowerCase());
            if (jetton) {
                decimals = jetton.decimals;
                symbol = jetton.symbol;
            }
        } catch (err) {
            printError(
                jsonMode,
                `Failed to fetch jetton info: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
            return;
        }

        if (decimals === undefined) {
            printError(
                jsonMode,
                `Cannot determine decimals for jetton ${jettonAddress}. The token may not be in your wallet.`,
            );
            return;
        }

        const rawAmount = toRawAmount(amount, decimals);

        const result = await withSpinner(`Sending ${amount} ${symbol || 'tokens'}...`, () =>
            service.sendJetton(toAddress, jettonAddress, rawAmount, comment),
        );

        if (!result.success) {
            printError(jsonMode, result.message);
            return;
        }

        const data = {
            success: true,
            message: result.message,
            details: {
                to: toAddress,
                jettonAddress,
                amount: `${amount} ${symbol || 'tokens'}`,
                comment: comment || null,
            },
        };

        const human =
            successHeader('Jetton Transfer Sent') +
            keyValue([
                ['To', toAddress],
                ['Jetton', jettonAddress],
                ['Amount', `${amount} ${symbol || 'tokens'}`],
                ['Comment', comment],
                ['Status', 'success'],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}

export async function sendRawCommand(
    service: CliWalletService,
    messagesJson: string,
    jsonMode: boolean,
): Promise<void> {
    try {
        let parsed: {
            messages: Array<{ address: string; amount: string; stateInit?: string; payload?: string }>;
            validUntil?: number;
            fromAddress?: string;
        };
        try {
            parsed = JSON.parse(messagesJson);
        } catch {
            printError(jsonMode, 'Invalid JSON for --messages. Expected { "messages": [...] }');
            return;
        }

        if (!parsed.messages || !Array.isArray(parsed.messages) || parsed.messages.length === 0) {
            printError(jsonMode, 'Messages array is required and must not be empty.');
            return;
        }

        const result = await withSpinner(`Sending raw transaction (${parsed.messages.length} message(s))...`, () =>
            service.sendRawTransaction(parsed),
        );

        if (!result.success) {
            printError(jsonMode, result.message);
            return;
        }

        const data = {
            success: true,
            message: result.message,
            details: {
                messageCount: parsed.messages.length,
                messages: parsed.messages.map((m) => ({
                    to: m.address,
                    amount: `${m.amount} nanoTON`,
                })),
            },
        };

        const human =
            successHeader('Raw Transaction Sent') +
            keyValue([
                ['Messages', String(parsed.messages.length)],
                ['Status', 'success'],
            ]);

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}
