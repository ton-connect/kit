/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CliWalletService } from '../services/CliWalletService.js';
import { header, tableRows, printResult, printError, dim, green, red, cyan, yellow } from '../utils/output.js';
import { withSpinner } from '../utils/spinner.js';

function relativeTime(ts: number): string {
    const now = Date.now();
    const diff = now - ts * 1000;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const d = new Date(ts * 1000);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

function formatTxSummary(tx: {
    type: string;
    description?: string;
    amount?: string;
    jettonAmount?: string;
    jettonSymbol?: string;
    dex?: string;
    amountIn?: string;
    amountOut?: string;
    from?: string;
    to?: string;
}): string {
    switch (tx.type) {
        case 'TonTransfer': {
            if (tx.amount) {
                const ton = (Number(BigInt(tx.amount)) / 1e9).toFixed(4);
                return `${ton} TON`;
            }
            return tx.description || 'TON Transfer';
        }
        case 'JettonTransfer': {
            const sym = tx.jettonSymbol || 'jetton';
            return tx.jettonAmount ? `${tx.jettonAmount} ${sym}` : `${sym} transfer`;
        }
        case 'JettonSwap': {
            return tx.description || `Swap via ${tx.dex || 'DEX'}`;
        }
        default:
            return tx.description || tx.type;
    }
}

function colorType(type: string): string {
    switch (type) {
        case 'TonTransfer':
            return cyan('TON');
        case 'JettonTransfer':
            return yellow('Jetton');
        case 'JettonSwap':
            return green('Swap');
        case 'NftItemTransfer':
            return cyan('NFT');
        case 'ContractDeploy':
            return dim('Deploy');
        case 'SmartContractExec':
            return dim('Contract');
        default:
            return dim(type);
    }
}

export async function transactionsCommand(service: CliWalletService, limit: number, jsonMode: boolean): Promise<void> {
    try {
        const transactions = await withSpinner('Fetching transactions...', () => service.getTransactions(limit));

        const mapped = transactions.map((tx) => ({
            eventId: tx.eventId,
            timestamp: tx.timestamp,
            date: new Date(tx.timestamp * 1000).toISOString(),
            type: tx.type,
            status: tx.status,
            description: tx.description,
            isScam: tx.isScam,
            ...(tx.type === 'TonTransfer' && {
                from: tx.from,
                to: tx.to,
                amount: tx.amount ? { ton: (Number(BigInt(tx.amount)) / 1e9).toString(), nanoTon: tx.amount } : null,
                comment: tx.comment,
            }),
            ...(tx.type === 'JettonTransfer' && {
                from: tx.from,
                to: tx.to,
                jettonAddress: tx.jettonAddress,
                jettonSymbol: tx.jettonSymbol,
                jettonAmount: tx.jettonAmount,
                comment: tx.comment,
            }),
            ...(tx.type === 'JettonSwap' && {
                dex: tx.dex,
                amountIn: tx.amountIn,
                amountOut: tx.amountOut,
                jettonSymbol: tx.jettonSymbol,
            }),
        }));

        const data = { success: true, transactions: mapped, count: mapped.length };

        if (jsonMode) {
            printResult(true, data, '');
            return;
        }

        const rows = transactions.map((tx) => {
            const statusIcon = tx.status === 'success' ? green('✓') : red('✗');
            const time = relativeTime(tx.timestamp);
            const type = colorType(tx.type);
            const summary = formatTxSummary(tx);
            return [statusIcon, dim(time), type, summary];
        });

        let human = header(`Transactions (${transactions.length})`);
        if (rows.length > 0) {
            human += tableRows([[dim(''), dim('When'), dim('Type'), dim('Details')], ...rows]);
        } else {
            human += '  No transactions found.';
        }

        printResult(false, data, human);
    } catch (error) {
        printError(jsonMode, error instanceof Error ? error.message : 'Unknown error');
    }
}
