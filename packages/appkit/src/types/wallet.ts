/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet } from '@ton/walletkit';

import type { SignDataRequest, SignDataResponse } from './signing';

export interface WalletInterface extends Omit<Wallet, 'getSignedSignData'> {
    connectorId: string;

    signData(payload: SignDataRequest): Promise<SignDataResponse>;
}
