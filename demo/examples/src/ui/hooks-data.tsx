/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { useBalance, useJettons, useNFTs } from '@ton/appkit-ui-react';

export const DataHooksExample = () => {
    // Get balance of selected wallet
    const { data: balance, isLoading: balanceLoading } = useBalance();

    // Get jettons
    const { data: jettons, isLoading: jettonsLoading } = useJettons();

    // Get NFTs
    const { data: nfts, isLoading: nftsLoading } = useNFTs();

    if (balanceLoading || jettonsLoading || nftsLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {/* balance.amount is likely what we want, need to check TokenAmount type */}
            <p>Balance: {balance?.toString()}</p>
            <p>Jettons count: {jettons?.jettons?.length}</p>
            <p>NFTs count: {nfts?.nfts?.length}</p>
        </div>
    );
};
