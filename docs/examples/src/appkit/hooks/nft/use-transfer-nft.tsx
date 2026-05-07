/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTransferNft } from '@ton/appkit-react';

export const UseTransferNftExample = () => {
    // SAMPLE_START: USE_TRANSFER_NFT
    const { mutate: transfer, isPending, error } = useTransferNft();

    const handleTransfer = () => {
        transfer({
            nftAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            comment: 'Gift for you',
        });
    };

    return (
        <div>
            <button onClick={handleTransfer} disabled={isPending}>
                {isPending ? 'Transferring...' : 'Transfer NFT'}
            </button>
            {error && <div>Error: {error.message}</div>}
        </div>
    );
    // SAMPLE_END: USE_TRANSFER_NFT
};
