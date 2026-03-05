/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Network } from '@ton/walletkit';

import { createWrapper } from '../../../../src/__tests__/test-utils';
import { TransactionExample } from './transaction';

describe('TransactionExample Component', () => {
    let mockAppKit: any;
    let mockSendTransaction: any;

    const mockBoc = 'te6cckEBAQEAAgAAAEysuc0=';
    const mockNetwork = Network.mainnet();

    // Mock wallet
    const mockWallet = {
        getAddress: () => 'EQaddress1',
        getNetwork: () => mockNetwork,
        sendTransaction: vi.fn(),
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockSendTransaction = vi.fn().mockResolvedValue({ boc: mockBoc });
        mockWallet.sendTransaction = mockSendTransaction;

        mockAppKit = {
            getDefaultNetwork: vi.fn(),
            connectors: [],
            walletsManager: {
                selectedWallet: mockWallet,
            },
            networkManager: {
                getClient: vi.fn(),
            },
            emitter: {
                on: vi.fn().mockReturnValue(() => {}),
                off: vi.fn(),
            },
        };
    });

    afterEach(() => {
        cleanup();
    });

    it('should render transaction button', () => {
        render(<TransactionExample />, { wrapper: createWrapper(mockAppKit) });
        // Transaction component likely renders a button
        // We look for a button
        expect(screen.getByRole('button')).toBeDefined();
    });

    it('should call sendTransaction on button click', async () => {
        render(<TransactionExample />, { wrapper: createWrapper(mockAppKit) });

        const button = screen.getByRole('button');
        act(() => {
            button.click();
        });

        await waitFor(() => {
            // It calls sendTransaction with the request returned by request
            expect(mockSendTransaction).toHaveBeenCalled();
            // We can check arguments more specifically if we want
            // The message is a Cell with "Hello, world!" string

            // Just verifying it was called is enough for integration test of example
        });
    });
});
