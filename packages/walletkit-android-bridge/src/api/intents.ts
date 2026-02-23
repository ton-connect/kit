/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * intents.ts – Bridge API for intent operations
 */

import { getKit } from '../utils/bridge';
import type {
    HandleIntentUrlArgs,
    IsIntentUrlArgs,
    ApproveTransactionIntentArgs,
    ApproveSignDataIntentArgs,
    ApproveActionIntentArgs,
    RejectIntentArgs,
    IntentItemsToTransactionRequestArgs,
    ProcessConnectAfterIntentArgs,
} from '../types';

export async function isIntentUrl(args: IsIntentUrlArgs) {
    const kit = await getKit();
    return kit.isIntentUrl(args.url);
}

export async function handleIntentUrl(args: HandleIntentUrlArgs) {
    const kit = await getKit();
    return kit.handleIntentUrl(args.url, args.walletId);
}

export async function approveTransactionIntent(args: ApproveTransactionIntentArgs) {
    const kit = await getKit();
    return kit.approveTransactionIntent(args.event, args.walletId);
}

export async function approveSignDataIntent(args: ApproveSignDataIntentArgs) {
    const kit = await getKit();
    return kit.approveSignDataIntent(args.event, args.walletId);
}

export async function approveActionIntent(args: ApproveActionIntentArgs) {
    const kit = await getKit();
    return kit.approveActionIntent(args.event, args.walletId);
}

export async function rejectIntent(args: RejectIntentArgs) {
    const kit = await getKit();
    return kit.rejectIntent(args.event, args.reason, args.errorCode);
}

export async function intentItemsToTransactionRequest(args: IntentItemsToTransactionRequestArgs) {
    const kit = await getKit();
    return kit.intentItemsToTransactionRequest(args.items, args.walletId);
}

export async function processConnectAfterIntent(args: ProcessConnectAfterIntentArgs) {
    const kit = await getKit();
    return kit.processConnectAfterIntent(args.event, args.walletId, args.proof);
}
