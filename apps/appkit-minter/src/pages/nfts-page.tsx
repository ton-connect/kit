/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { TonConnectButton, useSelectedWallet } from '@ton/appkit-react';
import { ImageIcon } from 'lucide-react';

import { NftsCard } from '@/features/nft';
import { EmptyState, Layout } from '@/core/components';

export const NftsPage: React.FC = () => {
    const [wallet] = useSelectedWallet();

    return (
        <Layout>
            {wallet ? (
                <NftsCard />
            ) : (
                <EmptyState
                    icon={ImageIcon}
                    title="No wallet connected"
                    description="Connect your wallet to see your NFTs."
                    action={<TonConnectButton />}
                />
            )}
        </Layout>
    );
};
