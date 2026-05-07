/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useNfts } from '@ton/appkit-react';

export const UseNftsExample = () => {
    // SAMPLE_START: USE_NFTS
    const {
        data: nfts,
        isLoading,
        error,
    } = useNfts({
        limit: 10,
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <h3>My NFTs</h3>
            <ul>
                {nfts?.nfts.map((nft) => (
                    <li key={nft.address.toString()}>
                        {nft.info?.name} ({nft.collection?.name})
                    </li>
                ))}
            </ul>
        </div>
    );
    // SAMPLE_END: USE_NFTS
};
