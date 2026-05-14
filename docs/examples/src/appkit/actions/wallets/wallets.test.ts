/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';
import type { WalletInterface } from '@ton/appkit';

import { getConnectedWalletsExample } from './get-connected-wallets';
import { getSelectedWalletExample } from './get-selected-wallet';
import { setSelectedWalletIdExample } from './set-selected-wallet-id';
import { watchConnectedWalletsExample } from './watch-connected-wallets';
import { watchSelectedWalletExample } from './watch-selected-wallet';

describe('Wallet Actions Examples (Integration)', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    const MOCK_WALLET_1 = {
        getWalletId: () => 'wallet-1',
        getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        getNetwork: () => 'mainnet',
    } as unknown as WalletInterface;

    const MOCK_WALLET_2 = {
        getWalletId: () => 'wallet-2',
        getAddress: () => 'EQBvW8Z9l8-z_oP_x2J4Cj9v9-y_X--8_e_v_y_f_v_8_e_'.slice(0, 48),
        getNetwork: () => 'testnet',
    } as unknown as WalletInterface;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
                [Network.testnet().chainId]: {},
            },
        });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('getConnectedWalletsExample', () => {
        it('should log connected wallets', () => {
            appKit.walletsManager.setWallets([MOCK_WALLET_1, MOCK_WALLET_2]);

            getConnectedWalletsExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Connected wallets:', [MOCK_WALLET_1, MOCK_WALLET_2]);
        });
    });

    describe('getSelectedWalletExample', () => {
        it('should log selected wallet info', () => {
            appKit.walletsManager.setWallets([MOCK_WALLET_1]);
            appKit.walletsManager.setSelectedWalletId('wallet-1');

            getSelectedWalletExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Selected wallet:', 'wallet-1');
            expect(consoleSpy).toHaveBeenCalledWith('Address:', MOCK_WALLET_1.getAddress());
        });

        it('should not log if no wallet is selected', () => {
            appKit.walletsManager.setWallets([MOCK_WALLET_1]);
            appKit.walletsManager.setSelectedWalletId(null);

            getSelectedWalletExample(appKit);

            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Selected wallet:'), expect.anything());
        });
    });

    describe('setSelectedWalletIdExample', () => {
        it('should set selected wallet id on walletsManager', () => {
            const spy = vi.spyOn(appKit.walletsManager, 'setSelectedWalletId');

            setSelectedWalletIdExample(appKit);

            expect(spy).toHaveBeenCalledWith('my-wallet-id');
        });
    });

    describe('watchConnectedWalletsExample', () => {
        it('should call onChange when wallets are updated', () => {
            const unsubscribe = watchConnectedWalletsExample(appKit);
            expect(unsubscribe).toBeTypeOf('function');

            // Manually emit the event as expected by the action
            appKit.emitter.emit('wallets:updated', { wallets: [MOCK_WALLET_1] }, 'test');

            expect(consoleSpy).toHaveBeenCalledWith('Connected wallets updated:', 1);

            unsubscribe();
        });
    });

    describe('watchSelectedWalletExample', () => {
        it('should call onChange when selected wallet changes', () => {
            const unsubscribe = watchSelectedWalletExample(appKit);

            // 1. Select a wallet
            appKit.walletsManager.setWallets([MOCK_WALLET_1]);
            appKit.walletsManager.setSelectedWalletId('wallet-1');
            // Manually emit selection changed event
            // @ts-expect-error - testing internal event emission
            appKit.emitter.emit('wallets:selection-changed', {}, 'test');
            expect(consoleSpy).toHaveBeenCalledWith('Selected wallet changed:', 'wallet-1');

            // 2. Deselect
            appKit.walletsManager.setSelectedWalletId(null);
            // @ts-expect-error - testing internal event emission
            appKit.emitter.emit('wallets:selection-changed', {}, 'test');
            expect(consoleSpy).toHaveBeenCalledWith('Wallet deselected');

            unsubscribe();
        });
    });
});
