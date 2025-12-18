/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Event type definitions for TON Connect protocol

import type { ConnectEventSuccess } from '@tonconnect/protocol';

import type { EventApprovalBase } from './internal';
import type { Base64String, SignDataPayload } from '../api/models';

export interface EventConnectApproval extends EventApprovalBase {
    result: ConnectApproval;
}

export interface ConnectApproval {
    dAppName: string;
    dAppUrl: string;
    dAppIconUrl: string;
    dAppDescription: string;

    from: string;

    response: ConnectEventSuccess;
}

export interface EventTransactionApproval extends EventApprovalBase {
    result: TransactionApproval;
}

export interface TransactionApproval {
    signedBoc: Base64String;
}

export interface EventSignDataApproval extends EventApprovalBase {
    result: SignDataApproval;
}

export interface SignDataApproval {
    signature: string;
    address: string;
    timestamp: number;
    domain: string;
    payload: SignDataPayload;
}
