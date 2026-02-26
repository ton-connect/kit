/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { CreateConnectorFn } from '../../types/connector';

export type AddConnectorParameters = CreateConnectorFn;

export type AddConnectorReturnType = () => void;

/**
 * Add a wallet connector
 */
export const addConnector = (appKit: AppKit, connectorFn: AddConnectorParameters): AddConnectorReturnType => {
    return appKit.addConnector(connectorFn);
};
