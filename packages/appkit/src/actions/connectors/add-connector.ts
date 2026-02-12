/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { Connector } from '../../types/connector';

export type AddConnectorParameters = Connector;

export type AddConnectorReturnType = () => void;

/**
 * Add a wallet connector
 */
export const addConnector = (appKit: AppKit, connector: AddConnectorParameters): AddConnectorReturnType => {
    return appKit.addConnector(connector);
};
