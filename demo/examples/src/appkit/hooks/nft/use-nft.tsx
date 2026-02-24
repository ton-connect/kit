/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useNft } from '@ton/appkit-react';

export const UseNftExample = () => {
    // SAMPLE_START: USE_NFT
    const {
        data: nft,
        isLoading,
        error,
    } = useNft({
        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <h3>NFT Details</h3>
            <p>Name: {nft?.info?.name}</p>
            <p>Collection: {nft?.collection?.name}</p>
            <p>Owner: {nft?.ownerAddress?.toString()}</p>
        </div>
    );
    // SAMPLE_END: USE_NFT
};
