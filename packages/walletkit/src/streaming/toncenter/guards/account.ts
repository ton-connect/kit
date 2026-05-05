/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingV2AccountStateNotification } from '../types';

export const isAccountStateNotification = (msg: unknown): msg is StreamingV2AccountStateNotification => {
    const m = msg as Record<string, unknown>;
    return (
        typeof msg === 'object' &&
        msg !== null &&
        m.type === 'account_state_change' &&
        typeof m.account === 'string' &&
        typeof m.state === 'object' &&
        m.state !== null &&
        typeof (m.state as Record<string, unknown>).balance === 'string'
    );
};
