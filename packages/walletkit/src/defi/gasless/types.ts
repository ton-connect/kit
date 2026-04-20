/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String, Hex, UserFriendlyAddress } from '../../api/models/core/Primitives';
import type { TransactionRequestMessage } from '../../api/models/transactions/TransactionRequest';

/**
 * Relayer configuration for gasless transactions.
 *
 * Reports which jettons the relayer accepts as fee payment and the address
 * where relayer commission is routed.
 */
export interface GaslessConfig {
    /** Address where the relayer expects to receive the commission */
    relayAddress: UserFriendlyAddress;
    /** Jettons supported by the relayer for paying the fee */
    gasJettons: GaslessGasJetton[];
}

/**
 * A jetton accepted by the relayer as a fee payment option.
 */
export interface GaslessGasJetton {
    /** Jetton master address */
    masterId: UserFriendlyAddress;
}

/**
 * Parameters to estimate a gasless transaction.
 *
 * The relayer wraps the caller's messages with commission-collection logic and
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

/**
 * Result of gasless estimation.
 *
 * Contains relayer-wrapped messages that should be passed to `wallet.signMessage`
 * in place of the caller's original messages, together with the commission the
 * relayer will deduct and the timestamp after which the estimate expires.
 */
export interface GaslessEstimateResult {
    /** Relayer-wrapped messages ready to be signed */
    messages: TransactionRequestMessage[];
    /** Relayer commission in fee-jetton nanounits */
    commission: bigint;
    /** Unix timestamp after which the bundle becomes invalid for relay */
    validUntil: number;
    /** Address of the relayer that produced this estimate */
    relayAddress: UserFriendlyAddress;
    /** Sender wallet address echoed by the relayer */
    from: UserFriendlyAddress;
}

/**
 * Parameters to submit a signed gasless transaction to the relayer.
 */
export interface GaslessSendParams {
    /** Sender wallet public key */
    walletPublicKey: Hex;
    /** Signed internal-message BoC obtained from `wallet.signMessage` */
    internalBoc: Base64String;
}

/**
 * Result of submitting a signed gasless transaction to the relayer.
 *
 * Fields are provider-specific; callers should not rely on a particular shape.
 */
export type GaslessSendResult = Record<string, unknown>;
