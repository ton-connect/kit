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
import { CardGenerator } from '@/features/mint';
import { NftsCard } from '@/features/nft';
import { WalletInfo } from '@/features/wallet';
import { Card, Layout } from '@/core/components';
import { SwapButton } from '@/features/swap';
import { StakingCard } from '@/features/staking';
import { SignMessageCard } from '@/features/signing';

export const MinterPage: React.FC = () => {
    const [wallet] = useSelectedWallet();
    const isConnected = !!wallet;

    return (
        <Layout title="NFT Minter">
            <div className="space-y-4">
                <WalletInfo />

                {/* Card Generator with integrated mint button */}
                <CardGenerator />

                {/* Connected wallet assets */}
                {isConnected && (
                    <div className="space-y-4">
                        <TokensCard />
                        <NftsCard />
                        <SignMessageCard />
                        <Card title="Swap">
                            <div className="flex flex-col gap-2">
                                <div>Default provider:</div>
                                <SwapButton amount="0.101" direction="from" />
                                <SwapButton amount="0.102" direction="to" />

                                <div>StonFi provider:</div>
                                <SwapButton amount="0.103" direction="from" providerId="omniston" />
                                <SwapButton amount="0.104" direction="to" providerId="omniston" />

                                <div>DeDust provider:</div>
                                <SwapButton amount="0.105" direction="from" providerId="dedust" />
                                <SwapButton amount="0.106" direction="to" providerId="dedust" />
                            </div>
                        </Card>

                        <StakingCard />
                    </div>
                )}
            </div>
        </Layout>
    );
};
