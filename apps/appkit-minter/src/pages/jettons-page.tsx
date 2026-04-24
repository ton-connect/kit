/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { Button, TonConnectButton, useJettons, useSelectedWallet } from '@ton/appkit-react';
import { RefreshCw, Wallet } from 'lucide-react';

import { TokensCard, DepositButton } from '@/features/balances';
import { EmptyState, Layout } from '@/core/components';

export const JettonsPage: React.FC = () => {
    const [wallet] = useSelectedWallet();
    const { refetch: onRefresh } = useJettons();

    return (
        <Layout
            title={
                <div className="flex items-center justify-between px-2 pt-2 pb-4 border-b md:p-0 md:border-none">
                    <p className="text-lg font-semibold text-foreground mr-3">Jettons</p>
                    <Button size="icon" variant="bezeled" onClick={() => onRefresh()}>
                        <RefreshCw size={16} />
                    </Button>
                </div>
            }
        >
            {wallet ? (
                <div className="space-y-4">
                    <DepositButton />
                    <TokensCard />
                </div>
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
