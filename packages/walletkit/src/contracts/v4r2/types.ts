/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CHAIN } from '@tonconnect/protocol';

import { WalletSigner } from '../../types/wallet';
import { ApiClient } from '../../types/toncenter/ApiClient';
import { Hex } from '../../types/primitive';

/**
 * Configuration for creating a WalletV4R2 adapter
 */
export interface WalletV4R2AdapterConfig {
    /** Signer function */
    signer: WalletSigner;
    /** Public key */
    publicKey: Hex;
    /** Wallet ID configuration */
    walletId?: number;
    /** Shared TON client instance */
    tonClient: ApiClient;
    /** Network */
    network: CHAIN;
    /** Workchain */
    workchain?: number;
}
