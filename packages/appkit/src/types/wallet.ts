/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, UserFriendlyAddress } from './primitives';
import type { TransactionRequest, SendTransactionResponse } from './transaction';
import type { SignDataRequest, SignDataResponse } from './signing';
import type { Network } from './network';

/**
 * Wallet contract surfaced by every {@link Connector} — covers identity (address, public key, network) and signing operations; reads (balance, jettons, NFTs) go through AppKit actions instead.
 *
 * @public
 * @category Type
 * @section Wallets
 */
export interface WalletInterface {
    /** Id of the {@link Connector} that produced this wallet. */
    readonly connectorId: string;

    /** Wallet address as a user-friendly base64url string. */
    getAddress(): UserFriendlyAddress;

    /** Wallet public key as a `0x`-prefixed hex string. */
    getPublicKey(): Hex;

    /** Network the wallet is currently connected to. */
    getNetwork(): Network;

    /** Stable identifier combining address and network — unique across AppKit's connected wallets. */
    getWalletId(): string;

    /** Send a transaction — the wallet signs and broadcasts it. */
    sendTransaction(request: TransactionRequest): Promise<SendTransactionResponse>;

    /** Sign arbitrary data via the TonConnect signData flow. */
    signData(payload: SignDataRequest): Promise<SignDataResponse>;
}
