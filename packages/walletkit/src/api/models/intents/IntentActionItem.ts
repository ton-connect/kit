/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String, UserFriendlyAddress } from '../core/Primitives';
import type { TokenAmount } from '../core/TokenAmount';
import type { ExtraCurrencies } from '../core/ExtraCurrencies';

/**
 * TON native coin transfer action.
 */
export interface SendTonAction {
    /** Destination address (user-friendly) */
    address: UserFriendlyAddress;
    /** Amount in nanotons */
    amount: TokenAmount;
    /** Cell payload (Base64 BoC) */
    payload?: Base64String;
    /** Contract deploy stateInit (Base64 BoC) */
    stateInit?: Base64String;
    /** Extra currencies */
    extraCurrency?: ExtraCurrencies;
}

/**
 * Jetton transfer action (TEP-74).
 */
export interface SendJettonAction {
    /** Jetton master contract address */
    jettonMasterAddress: UserFriendlyAddress;
    /** Transfer amount in jetton elementary units */
    jettonAmount: TokenAmount;
    /** Recipient address */
    destination: UserFriendlyAddress;
    /** Response destination (defaults to sender) */
    responseDestination?: UserFriendlyAddress;
    /** Custom payload (Base64 BoC) */
    customPayload?: Base64String;
    /** Forward TON amount (nanotons) */
    forwardTonAmount?: TokenAmount;
    /** Forward payload (Base64 BoC) */
    forwardPayload?: Base64String;
    /**
     * Query ID
     * @format int
     */
    queryId?: number;
}

/**
 * NFT transfer action (TEP-62).
 */
export interface SendNftAction {
    /** NFT item address */
    nftAddress: UserFriendlyAddress;
    /** New owner address */
    newOwnerAddress: UserFriendlyAddress;
    /** Response destination (defaults to sender) */
    responseDestination?: UserFriendlyAddress;
    /** Custom payload (Base64 BoC) */
    customPayload?: Base64String;
    /** Forward TON amount (nanotons) */
    forwardTonAmount?: TokenAmount;
    /** Forward payload (Base64 BoC) */
    forwardPayload?: Base64String;
    /**
     * Query ID
     * @format int
     */
    queryId?: number;
}

/**
 * Union of all intent action items, discriminated by `type`.
 */
export type IntentActionItem =
    | { type: 'sendTon'; value: SendTonAction }
    | { type: 'sendJetton'; value: SendJettonAction }
    | { type: 'sendNft'; value: SendNftAction };
