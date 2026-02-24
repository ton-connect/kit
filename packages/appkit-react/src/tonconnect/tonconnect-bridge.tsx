/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import type { TonConnectConnector } from '@ton/appkit';
import { TONCONNECT_DEFAULT_CONNECTOR_ID } from '@ton/appkit';

import { useConnectorById } from '../features/wallets/hooks/use-connector-by-id';

export interface TonConnectBridgeProps extends PropsWithChildren {
    connectorId?: string;
}

/**
 * Automatically creates TonConnectUIProvider if TonConnectConnector is found
 * @param children - The children to render
 * @param connectorId - The connector ID to use
 * @returns The TonConnectUIProvider or the children
 */
export const TonConnectBridge: FC<TonConnectBridgeProps> = ({
    children,
    connectorId = TONCONNECT_DEFAULT_CONNECTOR_ID,
}) => {
    const connector = useConnectorById(connectorId) as TonConnectConnector | undefined;
    const tonConnectUI = useMemo(() => connector?.tonConnectUI, [connector]);

    if (!tonConnectUI) {
        return <>{children}</>;
    }

    return <TonConnectUIProvider instance={tonConnectUI}>{children}</TonConnectUIProvider>;
};
