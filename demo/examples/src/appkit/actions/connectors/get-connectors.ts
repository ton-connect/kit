/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getConnectors } from '@ton/appkit';

export const getConnectorsExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_CONNECTORS
    const connectors = getConnectors(appKit);
    connectors.forEach((connector) => {
        console.log('Connector:', connector.id);
    });
    // SAMPLE_END: GET_CONNECTORS
};
