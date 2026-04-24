/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { CollectionsList } from '@/features/nft-purchase';
import { Layout } from '@/core/components';

export const NftPurchasePage: FC = () => {
    return (
        <Layout title="Buy NFT">
            <CollectionsList />
        </Layout>
    );
};
