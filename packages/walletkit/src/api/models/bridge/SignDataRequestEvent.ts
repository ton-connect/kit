/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DAppInfo } from '../core/DAppInfo';
import type { SignData } from '../core/SignData';

/**
 * Event containing a sign data request from a dApp via TON Connect.
 */
export interface SignDataRequestEvent {
    /**
     * Preview information for UI display
     */
    preview: SignDataRequestEventPreview;
}

/**
 * Preview data for displaying sign data request in the wallet UI.
 */
export interface SignDataRequestEventPreview {
    /**
     * Information about the requesting dApp
     */
    dAppInfo?: DAppInfo;
    /**
     * Data content to be signed
     */
    data: SignData;
}
