/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonApiActionSimplePreview {
    name?: string;
    description?: string;
    value?: string;
    value_image?: string;
    accounts?: TonApiAccountRef[];
}

export interface TonApiAction {
    type?: string;
    status?: 'ok' | 'failed';
    simple_preview?: TonApiActionSimplePreview;
    base_transactions?: string[];
    [key: string]: unknown;
}

export interface TonApiAccountEvent {
    event_id: string;
    timestamp: number;
    actions: TonApiAction[];
    account: string;
    is_scam?: boolean;
    lt?: string | number;
    in_progress?: boolean;
}

export interface TonApiAccountEventsResponse {
    events: TonApiAccountEvent[];
    next_from?: number;
}

export type TonApiAccountRef = string | { address: string };
