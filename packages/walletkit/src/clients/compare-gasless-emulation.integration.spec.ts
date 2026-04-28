/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Integration test — compares fetchEmulation output for a gasless transaction
 * from ApiClientToncenter and ApiClientTonApi.
 *
 * Flow:
 *   1. Fetch relay address from TonAPI gasless config
 *   2. Build gasless messages manually: user USDT transfer + fee payment to relayer
 *   3. Build W5R1 BOC from those messages (fake signature)
 *   4. Pass the same BOC to both clients and print moneyFlow + actions
 *
 * Excluded from regular `pnpm quality` runs (see vitest.config.ts).
 * Run with: pnpm test:integration
 *
 * Optional env vars:
 *   TONAPI_KEY     — TonAPI bearer token (higher rate limits)
 *   TONCENTER_KEY  — Toncenter API key
 */

import { describe, it } from 'vitest';
import { TonApiClient } from '@ton-api/client';
import { beginCell, Cell, external, internal, SendMode, storeMessage } from '@ton/core';

import { ActionSendMsg, packActionsList } from '../contracts/w5/actions';
import { createJettonTransferPayload } from '../utils/messageBuilders';
import { ApiClientTonApi } from './tonapi/ApiClientTonApi';
import { ApiClientToncenter } from './toncenter/ApiClientToncenter';
import { TonApiGaslessProvider } from '../defi/gasless/tonapi/TonApiGaslessProvider';
import type { Base64String } from '../api/models';
import { Network } from '../api/models';
import type { TransactionRequestMessage } from '../api/models';

const SENDER = 'UQA3H_ugYmVZhL3hVobnMARSTUwIFKfGeyrN5Q0qI723ngyW';
const RECIPIENT = 'UQCHK0FEaVC434Tv5cCrRkN4_1XPD-ya8WPrUstIxy6Ad33x';
const USDT_JETTON_WALLET = 'EQBpnvzlFxMrIxn1PuOyX4cj8l-ipBAeSmdvoiLL_4kB1lIM';
// Sender's USDT jetton wallet on the relayer side (for fee payment destination)
const SENDER_USDT_JETTON_WALLET = 'EQBpnvzlFxMrIxn1PuOyX4cj8l-ipBAeSmdvoiLL_4kB1lIM';
const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

const WALLET_ID = 2147483409;
const SEQNO = 227;

function buildW5Boc(messages: TransactionRequestMessage[]): Base64String {
    const actions = packActionsList(
        messages.map(
            (m) =>
                new ActionSendMsg(
                    SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                    internal({
                        to: m.address,
                        value: BigInt(m.amount),
                        bounce: true,
                        body: m.payload ? Cell.fromBase64(m.payload) : undefined,
                    }),
                ),
        ),
    );

    const timeout = Math.floor(Date.now() / 1000) + 600;
    const payload = beginCell()
        .storeUint(0x7369676e, 32)
        .storeUint(WALLET_ID, 32)
        .storeUint(timeout, 32)
        .storeUint(SEQNO, 32)
        .storeSlice(actions.beginParse())
        .endCell();

    const fakeSignature = Buffer.alloc(64, 0);
    const signedBody = beginCell().storeSlice(payload.beginParse()).storeBuffer(fakeSignature).endCell();

    const ext = external({ to: SENDER, body: signedBody });
    return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64') as Base64String;
}

function print(s: string): void {
    process.stdout.write(s + '\n');
}

describe('Gasless emulation — Toncenter vs TonAPI', () => {
    it('USDT gasless transfer', async () => {
        const apiKey = process.env.TONAPI_KEY;
        const tonApiClient = new TonApiClient({
            baseUrl: 'https://tonapi.io',
            ...(apiKey ? { apiKey } : {}),
        });

        const gaslessProvider = new TonApiGaslessProvider({ client: tonApiClient });

        print('\n--- Fetching gasless config (relay address) ---');
        const config = await gaslessProvider.getConfig();
        print(`Relay address: ${config.relayAddress}`);

        // Gasless USDT transfer: two messages the wallet will send —
        //   [0] user's actual USDT transfer to recipient
        //   [1] fee payment in USDT to the relayer's jetton wallet
        const SIMULATED_FEE = 100_000n; // 0.1 USDT — realistic estimate

        const userTransferPayload = createJettonTransferPayload({
            amount: 1_000_000n,
            destination: RECIPIENT,
            responseDestination: SENDER,
        });

        const feePayload = createJettonTransferPayload({
            amount: SIMULATED_FEE,
            destination: config.relayAddress,
            responseDestination: SENDER,
        });

        const messages: TransactionRequestMessage[] = [
            {
                address: USDT_JETTON_WALLET,
                amount: '50000000',
                payload: userTransferPayload.toBoc().toString('base64') as Base64String,
            },
            {
                address: SENDER_USDT_JETTON_WALLET,
                amount: '50000000',
                payload: feePayload.toBoc().toString('base64') as Base64String,
            },
        ];

        print(`Messages: ${messages.length} (transfer + fee payment)`);
        messages.forEach((m, i) => print(`  [${i}] to=${m.address} amount=${m.amount}`));

        const boc = buildW5Boc(messages);

        const toncenter = new ApiClientToncenter({
            network: Network.mainnet(),
            apiKey: process.env.TONCENTER_KEY,
        });

        const tonapi = new ApiClientTonApi({
            network: Network.mainnet(),
            apiKey,
        });

        print('\n--- Fetching emulation from both clients ---');

        const [tcResult, taResult] = await Promise.allSettled([
            toncenter.fetchEmulation(boc, true),
            tonapi.fetchEmulation(boc, true),
        ]);

        if (tcResult.status === 'rejected') print(`\nToncenter FAILED: ${tcResult.reason}`);
        if (taResult.status === 'rejected') print(`\nTonAPI FAILED: ${taResult.reason}`);
        if (tcResult.status === 'rejected' || taResult.status === 'rejected') return;

        const tc = tcResult.value.result === 'success' ? tcResult.value.emulationResult : null;
        const ta = taResult.value.result === 'success' ? taResult.value.emulationResult : null;

        if (!tc) {
            print(`Toncenter error: ${JSON.stringify(tcResult.value)}`);
            return;
        }
        if (!ta) {
            print(`TonAPI error: ${JSON.stringify(taResult.value)}`);
            return;
        }

        print('\n========== TONCENTER moneyFlow ==========');
        print(JSON.stringify(tc.moneyFlow, null, 2));

        print('\n========== TONAPI moneyFlow ==========');
        print(JSON.stringify(ta.moneyFlow, null, 2));

        print('\n========== TONCENTER actions ==========');
        print(
            JSON.stringify(
                tc.actions.map((a) => ({ type: a.type, details: a.details })),
                null,
                2,
            ),
        );

        print('\n========== TONAPI actions ==========');
        print(
            JSON.stringify(
                ta.actions.map((a) => ({ type: a.type, details: a.details })),
                null,
                2,
            ),
        );
    }, 60_000);
});
