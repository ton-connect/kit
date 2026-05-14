/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getConnectorById } from '@ton/appkit';

export const getConnectorByIdExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_CONNECTOR_BY_ID
    const connector = getConnectorById(appKit, {
        id: 'tonconnect',
    });

    if (connector) {
        console.log('Found connector:', connector.id);
    }
    // SAMPLE_END: GET_CONNECTOR_BY_ID
};
