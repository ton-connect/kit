/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SignDataApprovalResponse } from './SignDataApprovalResponse';
import type { SignDataRequestEvent } from './SignDataRequestEvent';

export interface SignDataRequest {
    event: SignDataRequestEvent;
    response?: SignDataApprovalResponse;
}
