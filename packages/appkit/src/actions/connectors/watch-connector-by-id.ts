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
import { getConnectorById } from './get-connector-by-id';

export interface WatchConnectorByIdParameters {
    id: string;
    onChange: (connector: Connector | undefined) => void;
}

export type WatchConnectorByIdReturnType = () => void;

/**
 * Watch connector by id
 */
export const watchConnectorById = (
    appKit: AppKit,
    parameters: WatchConnectorByIdParameters,
): WatchConnectorByIdReturnType => {
    const { id, onChange } = parameters;

    const unsubscribe = appKit.emitter.on(CONNECTOR_EVENTS.CONNECTED, () => {
        onChange(getConnectorById(appKit, { id }));
    });

    return unsubscribe;
};
