/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Connector } from '../../types/connector';
import type { AppKit } from '../../core/app-kit';

export interface GetConnectorByIdOptions {
    id: string;
}

export type GetConnectorByIdReturnType = Connector | undefined;

/**
 * Get connector by id
 */
export const getConnectorById = (appKit: AppKit, options: GetConnectorByIdOptions): GetConnectorByIdReturnType => {
    return appKit.connectors.find((connector) => connector.id === options.id);
};
