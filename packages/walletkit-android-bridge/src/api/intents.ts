/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * intents.ts – Intent URL handling operations
 *
 * Handles TonConnect intent deep links (tc://intent_inline?...) that allow
 * dApps to request actions without a prior TonConnect session.
 */

import type {
    HandleIntentUrlArgs,
    IsIntentUrlArgs,
    IntentItemsToTransactionRequestArgs,
    ApproveTransactionIntentArgs,
    ApproveSignDataIntentArgs,
    ApproveActionIntentArgs,
    ProcessConnectAfterIntentArgs,
    RejectIntentArgs,
} from '../types';
import { kit } from '../utils/bridge';

export const isIntentUrl = (args: IsIntentUrlArgs) => kit('isIntentUrl', args);
export const handleIntentUrl = (args: HandleIntentUrlArgs) => kit('handleIntentUrl', args);
export const intentItemsToTransactionRequest = (args: IntentItemsToTransactionRequestArgs) =>
    kit('intentItemsToTransactionRequest', args);
export const approveTransactionIntent = (args: ApproveTransactionIntentArgs) => kit('approveTransactionIntent', args);
export const approveSignDataIntent = (args: ApproveSignDataIntentArgs) => kit('approveSignDataIntent', args);
export const rejectIntent = (args: RejectIntentArgs) => kit('rejectIntent', args);
export const approveActionIntent = (args: ApproveActionIntentArgs) => kit('approveActionIntent', args);
export const processConnectAfterIntent = (args: ProcessConnectAfterIntentArgs) =>
    kit('processConnectAfterIntent', args);
