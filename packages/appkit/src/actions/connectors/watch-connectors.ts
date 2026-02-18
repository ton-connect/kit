/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import { CONNECTOR_EVENTS } from '../../core/app-kit';
import type { Connector } from '../../types/connector';
import { getConnectors } from './get-connectors';

export type WatchConnectorsParameters = {
    onChange: (connectors: readonly Connector[]) => void;
};

export type WatchConnectorsReturnType = () => void;

/**
 * Watch connectors
 */
export const watchConnectors = (appKit: AppKit, parameters: WatchConnectorsParameters): WatchConnectorsReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(CONNECTOR_EVENTS.CONNECTED, () => {
        onChange(getConnectors(appKit));
    });

    return unsubscribe;
};
