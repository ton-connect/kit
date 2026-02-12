/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { connect } from '@ton/appkit';

export const connectExample = async (appKit: AppKit) => {
    // SAMPLE_START: CONNECT
    await connect(appKit, {
        connectorId: 'tonconnect',
    });
    // SAMPLE_END: CONNECT
};
