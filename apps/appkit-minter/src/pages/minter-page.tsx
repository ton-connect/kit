/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { useSelectedWallet } from '@ton/appkit-react';

import { TokensCard, DepositButton } from '@/features/balances';
import { CardGenerator } from '@/features/mint';
import { NftsCard } from '@/features/nft';
import { Layout } from '@/core/components';

export const MinterPage: React.FC = () => {
    const [wallet] = useSelectedWallet();
    const isConnected = !!wallet;

    return (
        <Layout title="Mint">
            <div className="space-y-4">
                <CardGenerator />

                {isConnected && (
                    <div className="space-y-4">
                        <DepositButton />
                        <TokensCard />
                        <NftsCard />
                    </div>
                )}
            </div>
        </Layout>
    );
};
