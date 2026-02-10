/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SignDataPayload } from '../core/PreparedSignData';
import type { DAppInfo } from '../core/DAppInfo';
import type { BridgeEvent } from './BridgeEvent';
import type { SignDataBinary, SignDataCell, SignDataText } from '../core/SignData';

/**
 * Event containing a sign data request from a dApp via TON Connect.
 */
export interface SignDataRequestEvent extends BridgeEvent {
    /**
     * Payload containing the data to be signed
     */
    payload: SignDataPayload;
    /**
     * Preview information for UI display
     */
    preview: SignDataRequestEventPreview;
    /**
     * Raw TonConnect return strategy string.
     */
    returnStrategy?: string;
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
     * Array of sign data previews
     */
    data: SignDataPreview;
}

/**
 * Data to be signed by the wallet, discriminated by type.
 */
export type SignDataPreview =
    | { type: 'text'; value: SignDataPreviewText }
    | { type: 'binary'; value: SignDataPreviewBinary }
    | { type: 'cell'; value: SignDataPreviewCell };

/**
 * Binary data to be signed.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SignDataPreviewBinary extends SignDataBinary {}

/**
 * TON Cell data to be signed with a schema definition.
 */
export interface SignDataPreviewCell extends SignDataCell {
    parsed?: { [key: string]: unknown };
}

/**
 * Plain text data to be signed.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SignDataPreviewText extends SignDataText {}
