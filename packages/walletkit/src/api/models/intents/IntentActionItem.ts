/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '../core/Primitives';

/**
 * TON native coin transfer action.
 */
export interface SendTonAction {
    /** Action type discriminator */
    type: 'sendTon';
    /** Destination address (user-friendly) */
    address: string;
    /** Amount in nanotons */
    amount: string;
    /** Cell payload (Base64 BoC) */
    payload?: Base64String;
    /** Contract deploy stateInit (Base64 BoC) */
    stateInit?: Base64String;
    /** Extra currencies */
    extraCurrency?: Record<string, string>;
}

/**
 * Jetton transfer action (TEP-74).
 */
export interface SendJettonAction {
    /** Action type discriminator */
    type: 'sendJetton';
    /** Jetton master contract address */
    jettonMasterAddress: string;
    /** Transfer amount in jetton elementary units */
    jettonAmount: string;
    /** Recipient address */
    destination: string;
    /** Response destination (defaults to sender) */
    responseDestination?: string;
    /** Custom payload (Base64 BoC) */
    customPayload?: Base64String;
    /** Forward TON amount (nanotons) */
    forwardTonAmount?: string;
    /** Forward payload (Base64 BoC) */
    forwardPayload?: Base64String;
    /** Query ID */
    queryId?: number;
}

/**
 * NFT transfer action (TEP-62).
 */
export interface SendNftAction {
    /** Action type discriminator */
    type: 'sendNft';
    /** NFT item address */
    nftAddress: string;
    /** New owner address */
    newOwnerAddress: string;
    /** Response destination (defaults to sender) */
    responseDestination?: string;
    /** Custom payload (Base64 BoC) */
    customPayload?: Base64String;
    /** Forward TON amount (nanotons) */
    forwardTonAmount?: string;
    /** Forward payload (Base64 BoC) */
    forwardPayload?: Base64String;
    /** Query ID */
    queryId?: number;
}

/**
 * Union of all intent action items, discriminated by `type`.
 */
export type IntentActionItem = SendTonAction | SendJettonAction | SendNftAction;
