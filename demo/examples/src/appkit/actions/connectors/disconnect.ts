/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { disconnect } from '@ton/appkit';

export const disconnectExample = async (appKit: AppKit) => {
    // SAMPLE_START: DISCONNECT
    await disconnect(appKit, {
        connectorId: 'tonconnect',
    });
    // SAMPLE_END: DISCONNECT
};
