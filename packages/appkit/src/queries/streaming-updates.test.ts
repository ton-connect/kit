/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { QueryClient } from '@tanstack/query-core';

import { handleBalanceUpdate } from './balances/get-balance-by-address';
import { handleJettonBalanceUpdate } from './jettons/get-jetton-balance-by-address';
import { handleJettonsUpdate } from './jettons/get-jettons-by-address';
import { Network } from '../types/network';
import type { BalanceUpdate, JettonUpdate } from '../core/streaming';

describe('Streaming Updates Handlers', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = {
            setQueryData: vi.fn(),
            invalidateQueries: vi.fn(),
            getQueryData: vi.fn(),
        } as unknown as QueryClient;
    });

    const network = Network.mainnet();

    describe('handleBalanceUpdate', () => {
        it('should invalidate query immediately on invalidated status', () => {
            const address = 'EQD...';
            const update: BalanceUpdate = {
                type: 'balance',
                address,
                balance: '100',
                rawBalance: '100000000',
                status: 'invalidated',
            };

            handleBalanceUpdate(queryClient, { address, network }, update);

            expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
                queryKey: expect.arrayContaining(['balance']),
            });
            expect(queryClient.setQueryData).not.toHaveBeenCalled();
        });

        it('should update data on finalized status', () => {
            const address = 'EQD...';
            const update: BalanceUpdate = {
                type: 'balance',
                address,
                balance: '100',
                rawBalance: '100000000',
                status: 'finalized',
            };

            handleBalanceUpdate(queryClient, { address, network }, update);

            expect(queryClient.setQueryData).toHaveBeenCalled();
        });
    });

    describe('handleJettonBalanceUpdate', () => {
        it('should invalidate query immediately on invalidated status', () => {
            const ownerAddress = 'EQO...';
            const jettonAddress = 'EQJ...';
            const update: JettonUpdate = {
                type: 'jettons',
                ownerAddress,
                masterAddress: jettonAddress,
                walletAddress: jettonAddress,
                rawBalance: '50',
                status: 'invalidated',
            };

            handleJettonBalanceUpdate(queryClient, { ownerAddress, jettonAddress, network }, update);

            expect(queryClient.invalidateQueries).toHaveBeenCalled();
            expect(queryClient.setQueryData).not.toHaveBeenCalled();
        });
    });

    describe('handleJettonsUpdate', () => {
        it('should invalidate query immediately on invalidated status', () => {
            const address = 'EQA...';
            const update: JettonUpdate = {
                type: 'jettons',
                ownerAddress: address,
                masterAddress: address,
                walletAddress: address,
                rawBalance: '0',
                status: 'invalidated',
            };

            handleJettonsUpdate(queryClient, { address, network }, update);

            expect(queryClient.invalidateQueries).toHaveBeenCalled();
            expect(queryClient.setQueryData).not.toHaveBeenCalled();
        });
    });
});
