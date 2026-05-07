/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import { Logo } from '../../../../components/ui/logo';
import { VerifiedIcon } from '../../../../components/ui/icons';
import styles from './currency-item.module.css';

export interface CurrencyItemProps extends ComponentProps<'button'> {
    ticker: string;
    name?: string;
    balance?: string;
    icon?: string;
    isVerified?: boolean;
}

export const CurrencyItem: FC<CurrencyItemProps> = ({
    ticker,
    name,
    balance,
    icon,
    isVerified,
    className,
    ...props
}) => {
    return (
        <button className={clsx(styles.currencyItem, className)} {...props}>
            <Logo className={styles.icon} size={40} src={icon} fallback={ticker[0]} alt={ticker} />

            <div className={styles.info}>
                <div className={styles.header}>
                    <h4 className={styles.name}>{name || ticker}</h4>

                    {isVerified && <VerifiedIcon className={styles.verified} />}
                </div>

                <p className={styles.ticker}>
                    {ticker} • {name}
                </p>
            </div>

            {balance && (
                <div className={styles.balance}>
                    <p>{balance ?? '0'}</p>
                </div>
            )}
        </button>
    );
};
