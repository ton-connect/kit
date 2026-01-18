/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DAppInfo, UserFriendlyAddress, WalletId } from '../../..';

export interface TONConnectSession {
    sessionId: string;

    walletId: WalletId;
    walletAddress: UserFriendlyAddress;
    createdAt: string; // date
    lastActivityAt: string; // date
    privateKey: string;
    publicKey: string;

    dAppInfo: DAppInfo;

    // Bridge type indicator (needed to determine how to send disconnect events)
    isJsBridge?: boolean; // true if session was created via JS Bridge, false/undefined for HTTP Bridge
}
