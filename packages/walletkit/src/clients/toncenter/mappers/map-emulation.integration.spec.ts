/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Integration test — makes a real HTTP call to Toncenter.
 * Excluded from regular `pnpm quality` runs (see vitest.config.ts).
 * Run with: pnpm test:integration
 */

import { describe, it, expect } from 'vitest';
import { beginCell, external, internal, SendMode, storeMessage } from '@ton/core';

import type { ToncenterEmulationResponse } from '../../../types/toncenter/emulation';
import { WalletV4R2 } from '../../../contracts/v4r2/WalletV4R2';
import { WalletV4R2CodeCell } from '../../../contracts/v4r2/WalletV4R2.source';
import { defaultWalletIdV4R2 } from '../../../contracts/v4r2/constants';
import type { ApiClient } from '../../../types/toncenter/ApiClient';
import { mapToncenterEmulationResponse } from './map-emulation';

const TONCENTER_URL = 'https://toncenter.com';
// A well-known address to use as transfer recipient
const RECIPIENT = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

function buildBoc(): string {
    const wallet = WalletV4R2.createFromConfig(
        { publicKey: 0n, workchain: 0, seqno: 0, subwalletId: defaultWalletIdV4R2 },
        { code: WalletV4R2CodeCell, workchain: 0, client: {} as ApiClient },
    );

    const transferBody = wallet.createTransfer({
        seqno: 0,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: RECIPIENT,
                value: 100_000_000n, // 0.1 TON
                bounce: false,
            }),
        ],
        timeout: Math.floor(Date.now() / 1000) + 600,
    });

    const fakeSignature = Buffer.alloc(64, 0);
    const signedBody = beginCell().storeBuffer(fakeSignature).storeSlice(transferBody.asSlice()).endCell();

    const ext = external({
        to: wallet.address,
        init: wallet.init,
        body: signedBody,
    });

    return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64');
}

async function callEmulate(boc: string): Promise<ToncenterEmulationResponse> {
    const res = await fetch(`${TONCENTER_URL}/api/emulate/v1/emulateTrace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            boc,
            ignore_chksig: true,
            include_code_data: true,
            include_address_book: true,
            include_metadata: true,
            with_actions: true,
        }),
    });

    if (!res.ok) {
        throw new Error(`Toncenter responded ${res.status}: ${await res.text()}`);
    }

    return res.json() as Promise<ToncenterEmulationResponse>;
}

describe('mapToncenterEmulationResponse — real data', () => {
    it('maps a live Toncenter emulation response', async () => {
        const boc = buildBoc();
        const raw = await callEmulate(boc);
        const mapped = mapToncenterEmulationResponse(raw);

        const rawTx = Object.values(raw.transactions)[0];
        const mappedTx = Object.values(mapped.transactions)[0];

        process.stdout.write('\n--- raw tx (first) ---\n');
        process.stdout.write(JSON.stringify(rawTx, null, 2) + '\n');
        process.stdout.write('\n--- mapped tx (first) ---\n');
        process.stdout.write(JSON.stringify(mappedTx, null, 2) + '\n');
        process.stdout.write(`\nfield count: ${Object.keys(rawTx).length} → ${Object.keys(mappedTx).length}\n`);

        // Structural assertions
        expect(mapped.mcBlockSeqno).toBeGreaterThan(0);
        expect(mapped.trace.txHash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(mapped.isIncomplete).toBe(false);
        expect(mapped.randSeed).toMatch(/^0x[0-9a-f]+$/);

        expect(mappedTx.account).toMatch(/^EQ|UQ/);
        expect(mappedTx.hash).toMatch(/^0x[0-9a-f]{64}$/);
        expect(mappedTx.lt).toMatch(/^\d+$/);
        expect(typeof mappedTx.now).toBe('number');

        expect(Object.keys(mappedTx).length).toBe(Object.keys(rawTx).length);
        const snakeCaseKeys = Object.keys(mappedTx).filter((k) => k.includes('_'));
        expect(snakeCaseKeys).toHaveLength(0);

        const outMsg = mappedTx.outMsgs[0];
        if (outMsg) {
            expect(outMsg.hash).toMatch(/^0x[0-9a-f]{64}$/);
            expect(outMsg.destination).toMatch(/^EQ|UQ/);
            expect(outMsg.value).toBeTruthy();
        }
    }, 30_000);
});
