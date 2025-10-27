/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, Cell } from '@ton/core';
import { parseInternal } from '@truecarry/tlb-abi';

import { ConnectTransactionParamContent } from '../types/internal';
import { EmulationTokenInfoWallets, ToncenterEmulationResponse } from '../types/toncenter/emulation';
import { ErrorInfo } from '../errors/WalletKitError';
import { ERROR_CODES } from '../errors/codes';

// import { ConnectMessageTransactionMessage } from '@/types/connect';

export interface ToncenterMessage {
    method: string;
    headers: {
        'Content-Type': string;
    };
    body: string;
}

export type Asset =
    | {
          type: 'ton';
      }
    | {
          type: 'jetton';
          jetton: string;
      };

export type MoneyFlowRow = Asset & {
    from: string; // address
    to: string; // address
    amount: string;
};

export type MoneyFlowSelf = Asset & {
    amount: string;
};

export interface MoneyFlow {
    outputs: string; // amount of TON our account lost
    inputs: string; // amount of TON our account gained
    allJettonTransfers: MoneyFlowRow[]; // all jetton transfers
    ourTransfers: MoneyFlowSelf[];
    ourAddress: string | null;
}

export type ToncenterEmulationResult =
    | {
          result: 'success';
          emulationResult: ToncenterEmulationResponse;
      }
    | {
          result: 'error';
          emulationError: ErrorInfo;
      };

export interface ToncenterEmulationHook {
    emulation: ToncenterEmulationResult;
    moneyFlow: MoneyFlow;
    isCorrect: boolean;
    error: string | null;
}

const TON_PROXY_ADDRESSES = [
    '0:8CDC1D7640AD5EE326527FC1AD0514F468B30DC84B0173F0E155F451B4E11F7C',
    '0:671963027F7F85659AB55B821671688601CDCF1EE674FC7FBBB1A776A18D34A3',
];

/**
 * Creates a toncenter message payload for emulation
 */
export function createToncenterMessage(
    walletAddress: string | undefined,
    messages: ConnectTransactionParamContent['messages'],
): ToncenterMessage {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: walletAddress,
            valid_until: Math.floor(Date.now() / 1000) + 60,
            include_code_data: true,
            include_address_book: true,
            include_metadata: true,
            with_actions: true,
            messages: messages,
        }),
    };
}

export class FetchToncenterEmulationError extends Error {
    response: Response;
    constructor(message: string, response: Response) {
        super(message);
        this.name = 'fetchToncenterEmulationError';
        this.response = response;
    }
}

/**
 * Fetches toncenter emulation result
 */
export async function fetchToncenterEmulation(message: ToncenterMessage): Promise<ToncenterEmulationResult> {
    const response = await fetch('https://toncenter.com/api/emulate/v1/emulateTonConnect', message);
    if (!response.ok) {
        try {
            const errorMessage = await response.json();
            if (errorMessage.error === 'Failed to fetch account state: Account not found in accounts_dict') {
                return {
                    result: 'error',
                    emulationError: {
                        code: ERROR_CODES.ACCOUNT_NOT_FOUND,
                        message: 'Account not found',
                    },
                };
            }
        } catch (_) {
            throw new FetchToncenterEmulationError('Failed to fetch toncenter emulation result', response);
        }
        throw new FetchToncenterEmulationError('Failed to fetch toncenter emulation result', response);
    }
    const result = (await response.json()) as ToncenterEmulationResponse;
    return { result: 'success', emulationResult: result };
}

/**
 * Processes toncenter emulation result to extract money flow
 */
export function processToncenterMoneyFlow(emulation: ToncenterEmulationResponse): MoneyFlow {
    if (!emulation || !emulation.transactions) {
        return {
            outputs: '0',
            inputs: '0',
            allJettonTransfers: [],
            ourTransfers: [],
            ourAddress: null,
        };
    }

    const firstTx = emulation.transactions[emulation.trace.tx_hash];

    // Get all transactions for our account
    const ourTxes = Object.values(emulation.transactions).filter((t) => t.account === firstTx.account);

    const messagesFrom = ourTxes.flatMap((t) => t.out_msgs);
    const messagesTo = ourTxes.flatMap((t) => t.in_msg).filter((m) => m !== null);

    // Calculate TON outputs
    const outputs = messagesFrom
        .reduce((acc, m) => {
            if (m.value) {
                return acc + BigInt(m.value);
            }
            return acc + 0n;
        }, 0n)
        .toString();

    // Calculate TON inputs
    const inputs = messagesTo
        .reduce((acc, m) => {
            if (m.value) {
                return acc + BigInt(m.value);
            }
            return acc + 0n;
        }, 0n)
        .toString();

    // Process jetton transfers
    const jettonTransfers: MoneyFlowRow[] = [];

    for (const t of Object.values(emulation.transactions)) {
        if (!t.in_msg?.source) {
            continue;
        }

        const parsed = parseInternal(Cell.fromBase64(t.in_msg.message_content.body).beginParse());

        if (parsed?.internal !== 'jetton_transfer') {
            continue;
        }

        const from = Address.parse(t.in_msg.source);
        const to = parsed.data.destination instanceof Address ? parsed.data.destination : null;
        if (!to) {
            continue;
        }
        const jettonAmount = parsed.data.amount;

        const metadata = emulation.metadata[t.account];
        if (!metadata || !metadata?.token_info) {
            continue;
        }

        const tokenInfo = metadata.token_info.find((t) => t.valid && t.type === 'jetton_wallets') as
            | EmulationTokenInfoWallets
            | undefined;

        if (!tokenInfo) {
            continue;
        }

        const jettonAddress = Address.parse(tokenInfo.extra.jetton);

        jettonTransfers.push({
            from: from.toRawString().toUpperCase(),
            to: to.toRawString().toUpperCase(),
            jetton: jettonAddress.toRawString().toUpperCase(),
            amount: jettonAmount.toString(),
            type: 'jetton',
        });
    }

    const ourAddress = Address.parse(firstTx.account);

    const selfTransfers: MoneyFlowSelf[] = [];
    const ourJettonTransfersByAddress = jettonTransfers.reduce<Record<string, bigint>>((acc, transfer) => {
        if (transfer.type !== 'jetton') {
            return acc;
        }
        const jettonKey = transfer.jetton?.toString() || 'unknown';

        // TON Proxy
        if (TON_PROXY_ADDRESSES.includes(jettonKey)) {
            return acc;
        }

        const rawKey = Address.parse(jettonKey).toRawString().toUpperCase();
        if (!acc[rawKey]) {
            acc[rawKey] = 0n;
        }

        // Add to balance if receiving tokens (to our address)
        // Subtract from balance if sending tokens (from our address)
        if (ourAddress && transfer.to === ourAddress.toRawString().toUpperCase()) {
            acc[rawKey] += BigInt(transfer.amount);
        }
        if (ourAddress && transfer.from === ourAddress.toRawString().toUpperCase()) {
            acc[rawKey] -= BigInt(transfer.amount);
        }

        return acc;
    }, {});

    const ourJettonTransfers = Object.entries(ourJettonTransfersByAddress).map(([jettonKey, amount]) => ({
        type: 'jetton' as const,
        jetton: Address.parse(jettonKey).toRawString().toUpperCase(),
        amount: amount.toString(),
    }));
    selfTransfers.push({
        type: 'ton',
        amount: (BigInt(inputs) - BigInt(outputs)).toString(),
    });
    selfTransfers.push(...ourJettonTransfers);

    return {
        outputs,
        inputs,
        allJettonTransfers: jettonTransfers,
        ourTransfers: selfTransfers,
        ourAddress: ourAddress.toRawString().toUpperCase(),
    };
}
