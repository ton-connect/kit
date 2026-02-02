/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createWalletId } from './walletId';
import { Network } from '../api/models';

describe('walletId', () => {
    const testAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';

    describe('createWalletId', () => {
        it('should create wallet ID for mainnet', () => {
            const walletId1 = createWalletId(Network.mainnet(), testAddress);
            const walletId2 = createWalletId(Network.mainnet(), testAddress);

            expect(walletId1).toBe(walletId2);
        });

        it('should create wallet ID for testnet', () => {
            const walletId1 = createWalletId(Network.testnet(), testAddress);
            const walletId2 = createWalletId(Network.testnet(), testAddress);

            expect(walletId1).toBe(walletId2);
        });
    });
});
