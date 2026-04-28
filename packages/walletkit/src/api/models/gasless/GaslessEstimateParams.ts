/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, UserFriendlyAddress } from '../core/Primitives';
import type { TransactionRequestMessage } from '../transactions/TransactionRequest';

/**
 * Parameters to estimate a gasless transaction.
 *
 * The relayer wraps the caller's messages with fee-collection logic and
 * returns a new set of messages that the wallet should sign via `signMessage`.
 */
export interface GaslessEstimateParams {
    /** Master address of the jetton used to pay the relayer's fee */
    feeJettonMaster: UserFriendlyAddress;
    /** Sender wallet address */
    walletAddress: UserFriendlyAddress;
    /** Sender wallet public key */
    walletPublicKey: Hex;
    /** Messages that the caller wants to include in the transaction */
    messages: TransactionRequestMessage[];
}
