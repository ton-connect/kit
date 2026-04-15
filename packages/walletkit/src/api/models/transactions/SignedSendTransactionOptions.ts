/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface SignedSendTransactionOptions {
    fakeSignature?: boolean;
    /** Use internal message opcode (0x73696e74) instead of external (0x7369676e) for gasless relaying */
    internal?: boolean;
}
