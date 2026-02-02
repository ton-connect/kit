/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { useSelectedWallet, useSelectedWalletJettons } from '@ton/appkit-ui-react';

import { Layout, CardGenerator, WalletConnect, JettonsCard, NftsCard } from '@/components';
import { useWalletAssets } from '@/hooks';

export const MinterPage: React.FC = () => {
    const [wallet] = useSelectedWallet();
    const isConnected = !!wallet;
    const { nfts, isLoadingNfts, nftsError, loadNfts, transferNft, isTransferring } = useWalletAssets();

    const {
        data: jettonsResponse,
        isLoading: isLoadingJettons,
        isError: isErrorJettons,
        refetch: loadJettons,
    } = useSelectedWalletJettons({ refetchInterval: 10000 });

    const jettons = jettonsResponse?.jettons ?? [];

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
                        <JettonsCard
                            jettons={jettons}
                            isLoading={isLoadingJettons}
                            isError={isErrorJettons}
                            onRefresh={loadJettons}
                        />

                        <NftsCard
                            nfts={nfts}
                            isLoading={isLoadingNfts}
                            error={nftsError}
                            onRefresh={loadNfts}
                            onTransfer={transferNft}
                            isTransferring={isTransferring}
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
};
