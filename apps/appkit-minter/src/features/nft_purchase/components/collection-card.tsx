/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ImageIcon } from 'lucide-react';

import { useCollection } from '../hooks/use-collections';

interface CollectionCardProps {
    address: string;
}

export const CollectionCard: FC<CollectionCardProps> = ({ address }) => {
    const { data, isLoading, isError } = useCollection(address);

    const name = data?.name ?? (isLoading ? 'Loading…' : 'Unknown collection');
    const description = data?.description;
    const image = data?.image;

    return (
        <Link
            to={`/buy-nft/${address}`}
            className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted hover:bg-muted/70 transition-colors"
        >
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-background/60 flex items-center justify-center shrink-0">
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                ) : isLoading ? (
                    <div className="w-full h-full animate-pulse bg-background/80" />
                ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{name}</p>
                {description && !isError && <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>}
                {isError && <p className="text-xs text-destructive">Failed to load collection info</p>}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>
    );
};
