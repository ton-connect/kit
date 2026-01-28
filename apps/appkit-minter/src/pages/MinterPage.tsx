/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { useBalance, useSelectedWallet } from '@ton/appkit-ui-react';

import { Layout, CardGenerator, WalletConnect, JettonsCard, NftsCard } from '@/components';
import { useWalletAssets } from '@/hooks';

export const MinterPage: React.FC = () => {
    const [wallet] = useSelectedWallet();
    const isConnected = !!wallet;
    const {
        jettons,
        nfts,
        isLoadingJettons,
        isLoadingNfts,
        jettonsError,
        nftsError,
        loadJettons,
        loadNfts,
        transferJetton,
        transferNft,
        isTransferring,
    } = useWalletAssets();
    const balance = useBalance(
        { address: wallet?.getAddress() || '', network: wallet?.getNetwork() },
        { enabled: !!wallet, refetchInterval: 6000 },
    );

    console.log('balance', balance);

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
                            error={jettonsError}
                            onRefresh={loadJettons}
                            onTransfer={transferJetton}
                            isTransferring={isTransferring}
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
