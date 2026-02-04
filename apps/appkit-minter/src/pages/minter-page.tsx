/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { useSelectedWallet } from '@ton/appkit-ui-react';

import { TokensCard } from '@/features/balances';
import { CardGenerator } from '@/features/mint';
import { NftsCard } from '@/features/nft';
import { WalletConnect } from '@/features/wallet';
import { Layout } from '@/core/components';

export const MinterPage: React.FC = () => {
    const [wallet] = useSelectedWallet();
    const isConnected = !!wallet;

    return (
        <Layout title="NFT Minter">
            <div className="space-y-4">
                {/* Wallet Connection - shown when not connected */}
                {!isConnected && <WalletConnect />}

                {/* Card Generator with integrated mint button */}
                <CardGenerator />

                {/* Connected wallet assets */}
                {isConnected && (
                    <div className="space-y-4">
                        <TokensCard />
                        <NftsCard />
                    </div>
                )}
            </div>
        </Layout>
    );
};
