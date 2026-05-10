/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Connector } from '../../types/connector';
import type { AppKit } from '../../core/app-kit';

/**
 * Return type of {@link getConnectors} — read-only view of the registered-connectors array.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type GetConnectorsReturnType = readonly Connector[];

/**
 * List every connector registered on this AppKit instance — both those passed via {@link AppKitConfig}`.connectors` and those added later through {@link addConnector}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Read-only array of registered {@link Connector}s.
 *
 * @sample docs/examples/src/appkit/actions/connectors#GET_CONNECTORS
 *
 * @public
 * @category Action
 * @section Connectors
 */
export const getConnectors = (appKit: AppKit): GetConnectorsReturnType => {
    return appKit.connectors;
};
