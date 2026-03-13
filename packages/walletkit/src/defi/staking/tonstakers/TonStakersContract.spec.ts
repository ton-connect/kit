/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Cell } from '@ton/core';

import { PoolContract } from './PoolContract';
import { CONTRACT, STAKING_CONTRACT_ADDRESS } from './constants';
import { Network } from '../../../api/models';

const mockApiClient = {
    runGetMethod: vi.fn(),
    getBalance: vi.fn(),
};

describe('TonStakersContract', () => {
    let contract: PoolContract;

    beforeEach(() => {
        vi.clearAllMocks();
        contract = new PoolContract(STAKING_CONTRACT_ADDRESS[Network.mainnet().chainId], mockApiClient as never);
    });

    describe('buildStakePayload', () => {
        it('should create correct Cell with op code, query_id, and partner code', () => {
            const queryId = 123n;
            const payload = contract.buildStakePayload(queryId);

            const cell = Cell.fromBase64(payload);
            const slice = cell.beginParse();

            expect(slice.loadUint(32)).toBe(CONTRACT.PAYLOAD_STAKE);
            expect(slice.loadUintBig(64)).toBe(queryId);
            expect(slice.loadUintBig(64)).toBe(BigInt(CONTRACT.PARTNER_CODE));
        });

        it('should use default query_id of 1n when not provided', () => {
            const payload = contract.buildStakePayload();

            const cell = Cell.fromBase64(payload);
            const slice = cell.beginParse();

            slice.loadUint(32);
            expect(slice.loadUintBig(64)).toBe(0n);
        });
    });

    describe('buildUnstakePayload', () => {
        const baseParams = {
            amount: 1000000000n,
            userAddress: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        };

        it('should build Delayed unstake payload (waitTillRoundEnd=false, fillOrKill=false)', () => {
            const payload = contract.buildUnstakePayload({
                ...baseParams,
                waitTillRoundEnd: false,
                fillOrKill: false,
            });

            const cell = Cell.fromBase64(payload);
            const slice = cell.beginParse();

            expect(slice.loadUint(32)).toBe(CONTRACT.PAYLOAD_UNSTAKE);
            expect(slice.loadUintBig(64)).toBe(0n);
            expect(slice.loadCoins()).toBe(baseParams.amount);
            slice.loadAddress();

            const burnPayloadRef = slice.loadMaybeRef();
            expect(burnPayloadRef).not.toBeNull();
            const burnSlice = burnPayloadRef!.beginParse();
            expect(burnSlice.loadBit()).toBe(false);
            expect(burnSlice.loadBit()).toBe(false);
        });

        it('should build Instant unstake payload (waitTillRoundEnd=false, fillOrKill=true)', () => {
            const payload = contract.buildUnstakePayload({
                ...baseParams,
                waitTillRoundEnd: false,
                fillOrKill: true,
            });

            const cell = Cell.fromBase64(payload);
            const slice = cell.beginParse();

            slice.loadUint(32);
            slice.loadUintBig(64);
            slice.loadCoins();
            slice.loadAddress();

            const burnPayloadRef = slice.loadMaybeRef();
            expect(burnPayloadRef).not.toBeNull();
            const burnSlice = burnPayloadRef!.beginParse();
            expect(burnSlice.loadBit()).toBe(false);
            expect(burnSlice.loadBit()).toBe(true);
        });

        it('should build BestRate unstake payload (waitTillRoundEnd=true, fillOrKill=false)', () => {
            const payload = contract.buildUnstakePayload({
                ...baseParams,
                waitTillRoundEnd: true,
                fillOrKill: false,
            });

            const cell = Cell.fromBase64(payload);
            const slice = cell.beginParse();

            slice.loadUint(32);
            slice.loadUintBig(64);
            slice.loadCoins();
            slice.loadAddress();

            const burnPayloadRef = slice.loadMaybeRef();
            expect(burnPayloadRef).not.toBeNull();
            const burnSlice = burnPayloadRef!.beginParse();
            expect(burnSlice.loadBit()).toBe(true);
            expect(burnSlice.loadBit()).toBe(false);
        });

        it('should use custom query_id when provided', () => {
            const customQueryId = 999n;
            const payload = contract.buildUnstakePayload({
                ...baseParams,
                waitTillRoundEnd: false,
                fillOrKill: false,
                queryId: customQueryId,
            });

            const cell = Cell.fromBase64(payload);
            const slice = cell.beginParse();

            slice.loadUint(32);
            expect(slice.loadUintBig(64)).toBe(customQueryId);
        });
    });
});
