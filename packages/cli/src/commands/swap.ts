/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CliWalletService } from '../services/CliWalletService.js';
import { header, keyValue, printResult, printError, dim } from '../utils/output.js';
import { withSpinner } from '../utils/spinner.js';

export async function swapQuoteCommand(
    service: CliWalletService,
    fromToken: string,
    toToken: string,
    amount: string,
    slippageBps: number | undefined,
    jsonMode: boolean,
): Promise<void> {
    try {
        const result = await withSpinner('Fetching swap quote...', () =>
            service.getSwapQuote(fromToken, toToken, amount, slippageBps),
        );

        const data = {
            success: true,
            quote: {
                fromToken: result.fromToken,
                toToken: result.toToken,
                fromAmount: result.fromAmount,
                toAmount: result.toAmount,
                minReceived: result.minReceived,
                provider: result.provider,
                expiresAt: result.expiresAt ? new Date(result.expiresAt * 1000).toISOString() : null,
            },
            transaction: result.transaction,
            note: 'If user confirms, use "ton send raw" with the transaction params to execute the swap.',
        };

        const human =
            header('Swap Quote') +
            keyValue([
                ['From', `${result.fromAmount} ${result.fromToken}`],
                ['To', `${result.toAmount} ${result.toToken}`],
                ['Min Received', result.minReceived],
                ['Provider', result.provider],
                ['Expires', result.expiresAt ? new Date(result.expiresAt * 1000).toISOString() : 'N/A'],
            ]) +
            '\n\n' +
            dim("  To execute: ton send raw --messages '<transaction JSON above>'");

        printResult(jsonMode, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}
