/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import type { WalletWithMetadata } from '@privy-io/react-auth';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import type { PrivyConnector } from '@ton/appkit';
import { PRIVY_DEFAULT_CONNECTOR_ID } from '@ton/appkit';

import { useConnectorById } from '../features/wallets/hooks/use-connector-by-id';

export interface PrivyBridgeProps extends PropsWithChildren {
    connectorId?: string;
}

/**
 * Reads Privy's React hooks and pushes the current state into the matching
 * `PrivyConnector` in the AppKit instance. Mirrors how `<TonConnectBridge>`
 * wires TonConnectUI into its connector.
 *
 * Place inside `<PrivyProvider>` and `<AppKitProvider>`.
 */
export const PrivyBridge: FC<PrivyBridgeProps> = ({ children, connectorId = PRIVY_DEFAULT_CONNECTOR_ID }) => {
    const connector = useConnectorById(connectorId);
    const { user, getAccessToken } = usePrivy();
    const { signRawHash } = useSignRawHash();

    useEffect(() => {
        if (!connector || connector.type !== 'privy') {
            return;
        }
        const privyConnector = connector as PrivyConnector;

        const tonAccount = user?.linkedAccounts?.find(
            (a): a is WalletWithMetadata => a.type === 'wallet' && 'chainType' in a && a.chainType === 'ton',
        );

        const tonWallet =
            tonAccount && tonAccount.id ? { signerAddress: tonAccount.address, walletId: tonAccount.id } : null;

        privyConnector.updatePrivyState({
            tonWallet,
            getAccessToken,
            signRawHash,
        });
    }, [connector, user, getAccessToken, signRawHash]);

    return children;
};
