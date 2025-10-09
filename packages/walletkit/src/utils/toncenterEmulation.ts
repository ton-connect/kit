import { Address, Cell } from '@ton/core';
import { parseInternal } from '@truecarry/tlb-abi';

import { ConnectTransactionParamContent } from '../types/internal';
import { EmulationTokenInfoWallets, ToncenterEmulationResponse } from '../types/toncenter/emulation';
import { EmulationError, EmulationErrorTransactionAccountNotFound } from '../types/emulation/errors';

// import { ConnectMessageTransactionMessage } from '@/types/connect';

export interface ToncenterMessage {
    method: string;
    headers: {
        'Content-Type': string;
    };
    body: string;
}

export interface MoneyFlow {
    outputs: string;
    inputs: string;
    jettonTransfers: {
        from: Address;
        to: Address;
        jetton: Address | null;
        amount: string;
    }[];
    ourAddress: Address | null;
}

export type ToncenterEmulationResult =
    | {
          result: 'success';
          emulationResult: ToncenterEmulationResponse;
      }
    | {
          result: 'error';
          emulationError: EmulationError;
      };

export interface ToncenterEmulationHook {
    emulation: ToncenterEmulationResult;
    moneyFlow: MoneyFlow;
    isCorrect: boolean;
    error: string | null;
}

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
                    emulationError: new EmulationErrorTransactionAccountNotFound('Account not found'),
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
            jettonTransfers: [],
            ourAddress: null,
        };
    }

    const firstTx = emulation.transactions[emulation.trace.tx_hash];

    // Get all transactions for our account
    const ourTxes = Object.values(emulation.transactions).filter((t) => t.account === firstTx.account);

    const messagesFrom = ourTxes.flatMap((t) => t.out_msgs);
    const messagesTo = ourTxes.flatMap((t) => t.in_msg).filter((m) => m !== null);

    // Calculate TON outputs (message values + transaction fees)
    const messageOutputs = messagesFrom
        .reduce((acc, m) => {
            if (m.value) {
                return acc + BigInt(m.value);
            }
            return acc + 0n;
        }, 0n);
    
    // Add total fees from all our transactions
    const totalFees = ourTxes
        .reduce((acc, t) => {
            if (t.total_fees) {
                return acc + BigInt(t.total_fees);
            }
            return acc + 0n;
        }, 0n);
    
    const outputs = (messageOutputs + totalFees).toString();

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
    const jettonTransfers: {
        from: Address;
        to: Address;
        jetton: Address | null;
        amount: string;
    }[] = [];

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
            from,
            to,
            jetton: jettonAddress,
            amount: jettonAmount.toString(),
        });
    }

    return {
        outputs,
        inputs,
        jettonTransfers,
        ourAddress: Address.parse(firstTx.account),
    };
}

/**
 * Validates toncenter money flow against local money flow
 */
export function validateToncenterMoneyFlow(
    toncenterFlow: MoneyFlow,
    localFlow: MoneyFlow,
): { isValid: boolean; error: string | null } {
    if (!toncenterFlow?.ourAddress || !localFlow?.ourAddress) {
        return { isValid: false, error: 'Missing wallet addresses' };
    }

    if (toncenterFlow.outputs !== localFlow.outputs) {
        return { isValid: false, error: 'Wrong toncenter money flow outputs' };
    }

    if (toncenterFlow.inputs !== localFlow.inputs) {
        return {
            isValid: false,
            error: `Wrong toncenter money flow inputs: ${toncenterFlow.inputs} ${localFlow.inputs}`,
        };
    }

    if (toncenterFlow.jettonTransfers.length !== localFlow.jettonTransfers.length) {
        return { isValid: false, error: 'Wrong toncenter money flow jetton transfers count' };
    }

    for (const t of toncenterFlow.jettonTransfers) {
        const jettonTransfer = localFlow.jettonTransfers.find(
            (j) => t.jetton && j.jetton?.equals(t.jetton) && j.from?.equals(t.from) && j.to?.equals(t.to),
        );

        if (!jettonTransfer) {
            return {
                isValid: false,
                error: `Wrong toncenter money flow jetton transfers exist: ${t.jetton} ${t.from} ${t.to}`,
            };
        }

        if (jettonTransfer.amount !== t.amount) {
            return {
                isValid: false,
                error: `Wrong toncenter money flow jetton transfers amount: ${t.jetton} ${t.from} ${t.to} ${jettonTransfer.amount} ${t.amount}`,
            };
        }
    }

    return { isValid: true, error: null };
}
