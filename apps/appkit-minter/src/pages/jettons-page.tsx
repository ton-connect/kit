/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { useSelectedWallet } from '@ton/appkit-react';

import { TokensCard } from '@/features/balances';
import { Layout } from '@/core/components';

export const JettonsPage: React.FC = () => {
    const [wallet] = useSelectedWallet();

    return (
        <Layout>
            {wallet ? (
                <TokensCard />
            ) : (
                <p className="text-sm text-tertiary-foreground">Connect your wallet to see your jettons.</p>
            )}
        </Layout>
    );
};
