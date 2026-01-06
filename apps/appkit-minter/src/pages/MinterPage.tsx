/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';

import { Layout, CardGenerator, WalletConnect, MintButton } from '@/components';
import { useAppKit } from '@/hooks';

export const MinterPage: React.FC = () => {
    const { isConnected } = useAppKit();

    return (
        <Layout title="NFT Minter">
            <div className="space-y-6">
                {/* Wallet Connection - shown when not connected */}
                {!isConnected && <WalletConnect />}

                {/* Card Generator */}
                <CardGenerator />

                {/* Mint Button */}
                <MintButton />

                {/* Connected wallet details - shown when connected */}
                {isConnected && <WalletConnect />}
            </div>
        </Layout>
    );
};
