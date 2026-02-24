/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Connector } from '../../types/connector';
import type { AppKit } from '../../core/app-kit';

export type GetConnectorsReturnType = readonly Connector[];

/**
 * Get connected wallets
 */
export const getConnectors = (appKit: AppKit): GetConnectorsReturnType => {
    return appKit.connectors;
};
