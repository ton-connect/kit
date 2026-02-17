/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { FC, PropsWithChildren } from 'react';
export interface TonConnectBridgeProps extends PropsWithChildren {
    connectorId?: string;
}
/**
 * Automatically creates TonConnectUIProvider if TonConnectConnector is found
 * @param children - The children to render
 * @param connectorId - The connector ID to use
 * @returns The TonConnectUIProvider or the children
 */
export declare const TonConnectBridge: FC<TonConnectBridgeProps>;
//# sourceMappingURL=tonconnect-bridge.d.ts.map