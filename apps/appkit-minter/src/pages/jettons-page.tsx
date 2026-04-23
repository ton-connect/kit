/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { TonConnectButton, useSelectedWallet } from '@ton/appkit-react';
import { Wallet } from 'lucide-react';

import { TokensCard } from '@/features/balances';
import { EmptyState, Layout } from '@/core/components';

export const JettonsPage: React.FC = () => {
    const [wallet] = useSelectedWallet();

    return (
        <Layout>
            {wallet ? (
                <TokensCard />
            ) : (
                <EmptyState
                    icon={Wallet}
                    title="No wallet connected"
                    description="Connect your wallet to see your jettons."
                    action={<TonConnectButton />}
                />
            )}
        </Layout>
    );
};
