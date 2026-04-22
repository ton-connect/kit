/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

export const toBounceableAddress = (data?: Address | string | null): string | undefined => {
    if (data instanceof Address) {
        return data.toString();
    }

    try {
        if (data) return Address.parse(data).toString({ bounceable: true });
    } catch {
        //
    }
};

export const toNonBounceableAddress = (data?: Address | string | null): string | undefined => {
    if (data instanceof Address) {
        return data.toString({ bounceable: false });
    }

    try {
        if (data) return Address.parse(data).toString({ bounceable: false });
    } catch {
        //
    }
};
