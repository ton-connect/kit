/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/walletkit';
import { useMemo, useCallback } from 'react';
import type { FC, ComponentProps, SyntheticEvent } from 'react';
import { getFormattedNftInfo } from '@ton/appkit';
import clsx from 'clsx';

import { useI18n } from '../../../../hooks/use-i18n';
import styles from './nft-item.module.css';

export interface NftItemProps extends ComponentProps<'button'> {
    nft: NFT;
}

export const NftItem: FC<NftItemProps> = ({ nft, className, ...props }) => {
    const { t } = useI18n();
    const { name, collectionName, image, isOnSale } = useMemo(() => getFormattedNftInfo(nft), [nft]);

    const handleImageError = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
            parent.innerHTML = `
                <svg class="${styles.placeholderIcon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            `;
        }
    }, []);

    return (
        <button className={clsx(styles.nftItem, className)} {...props}>
            <div className={styles.imageWrapper}>
                {image ? (
                    <img src={image} alt={name} className={styles.image} onError={handleImageError} />
                ) : (
                    <svg className={styles.placeholderIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                )}
            </div>

            <div className={styles.info}>
                <h4 className={styles.name}>{name}</h4>
                <p className={styles.collectionName}>{collectionName}</p>
                {isOnSale && <span className={styles.saleBadge}>{t('nft.onSale')}</span>}
            </div>
        </button>
    );
};
