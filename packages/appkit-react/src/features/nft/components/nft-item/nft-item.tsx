/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/appkit';
import { useMemo, useState } from 'react';
import type { FC, ComponentProps } from 'react';
import { getFormattedNftInfo } from '@ton/appkit';
import clsx from 'clsx';

import { ImageIcon } from '../../../../components/ui/icons';
import { useI18n } from '../../../settings/hooks/use-i18n';
import styles from './nft-item.module.css';

export interface NftItemProps extends ComponentProps<'button'> {
    nft: NFT;
}

export const NftItem: FC<NftItemProps> = ({ nft, className, ...props }) => {
    const { t } = useI18n();
    const { name, collectionName, image, isOnSale } = useMemo(() => getFormattedNftInfo(nft), [nft]);
    const [imageError, setImageError] = useState(false);

    const showImage = image && !imageError;

    return (
        <button className={clsx(styles.nftItem, className)} {...props}>
            <div className={styles.imageWrapper}>
                {showImage ? (
                    <img src={image} alt={name} className={styles.image} onError={() => setImageError(true)} />
                ) : (
                    <ImageIcon className={styles.placeholderIcon} />
                )}
                {isOnSale && <span className={styles.saleBadge}>{t('nft.onSale')}</span>}
            </div>

            <div className={styles.info}>
                <h4 className={styles.name}>{name}</h4>
                <p className={styles.collectionName}>{collectionName}</p>
            </div>
        </button>
    );
};
