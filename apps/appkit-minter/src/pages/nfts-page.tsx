/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Button, TonConnectButton, useNfts, useSelectedWallet } from '@ton/appkit-react';
import { ImageIcon, RefreshCw } from 'lucide-react';

import { NftsCard } from '@/features/nft';
import { EmptyState, Layout } from '@/core/components';

export const NftsPage: React.FC = () => {
    const [wallet] = useSelectedWallet();
    const { refetch: onRefresh } = useNfts();

    return (
        <Layout
            title={
                <div className="w-full flex items-center justify-between px-2 pt-2 pb-4 border-b mb-3 md:m-0 md:p-0 md:border-none">
                    <p className="text-lg font-semibold text-foreground mr-3">NFTs</p>
                    <Button size="icon" variant="bezeled" onClick={() => onRefresh()}>
                        <RefreshCw size={16} />
                    </Button>
                </div>
            }
        >
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
