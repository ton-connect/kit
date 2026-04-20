/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { useFeaturedCollectionAddresses } from '../hooks/use-collections';
import { CollectionCard } from './collection-card';

import { Card } from '@/core/components';

export const CollectionsList: FC = () => {
    const addresses = useFeaturedCollectionAddresses();

    return (
        <Card title="Collections">
            <div className="space-y-3">
                {addresses.map((address) => (
                    <CollectionCard key={address} address={address} />
                ))}
            </div>
        </Card>
    );
};
