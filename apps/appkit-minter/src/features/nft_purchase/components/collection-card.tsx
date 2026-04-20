/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, ChevronRight } from 'lucide-react';

import type { FeaturedCollection } from '../lib/featured-collections';

interface CollectionCardProps {
    collection: FeaturedCollection;
}

export const CollectionCard: FC<CollectionCardProps> = ({ collection }) => {
    return (
        <Link
            to={`/buy-nft/${collection.address}`}
            className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted hover:bg-muted/70 transition-colors"
        >
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-background/60 flex items-center justify-center shrink-0">
                {collection.image ? (
                    <img src={collection.image} alt={collection.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{collection.name}</p>
                {collection.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{collection.description}</p>
                )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>
    );
};
