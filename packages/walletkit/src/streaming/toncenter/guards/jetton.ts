/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingV2JettonsNotification } from '../types';

export const isJettonsNotification = (msg: unknown): msg is StreamingV2JettonsNotification => {
    const m = msg as Record<string, unknown>;
    return (
        typeof msg === 'object' &&
        msg !== null &&
        m.type === 'jettons_change' &&
        typeof m.jetton === 'object' &&
        m.jetton !== null &&
        typeof (m.jetton as Record<string, unknown>).address === 'string' &&
        typeof (m.jetton as Record<string, unknown>).owner === 'string'
    );
};
