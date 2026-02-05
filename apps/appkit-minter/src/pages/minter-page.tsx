/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { useSelectedWallet } from '@ton/appkit-ui-react';
import { parseUnits } from '@ton/appkit';

import { TokensCard } from '@/features/balances';
import { CardGenerator } from '@/features/mint';
import { NftsCard } from '@/features/nft';
import { WalletConnect } from '@/features/wallet';
import { Layout } from '@/core/components';
import { SwapButton } from '@/features/swap';

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
                        <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                            <h3 className="mb-2 text-sm font-medium text-gray-500 uppercase">Swap Demo</h3>
                            <SwapButton />
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};
