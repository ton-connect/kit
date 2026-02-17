/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import { CircleIcon } from '../../../../components/circle-icon';
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
            <CircleIcon className={styles.icon} size={40} src={icon} fallback={ticker[0]} alt={ticker} />

            <div className={styles.info}>
                <div className={styles.header}>
                    <h4 className={styles.name}>{name || ticker}</h4>

                    {isVerified && (
                        <svg className={styles.verified} fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>

                <p className={styles.ticker}>{ticker}</p>
            </div>

            <div className={styles.balance}>
                <p>{balance ?? '0'}</p>
            </div>
        </button>
    );
};
