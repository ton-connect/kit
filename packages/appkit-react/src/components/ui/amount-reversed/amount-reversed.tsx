/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import { formatLargeValue } from '@ton/appkit';
import clsx from 'clsx';

import styles from './amount-reversed.module.css';
import { Skeleton } from '../skeleton';
import { FlipIcon } from '../icons';

export interface AmountReversedProps extends ComponentProps<'div'> {
    value: string;
    onChangeDirection?: () => void;
    ticker?: string;
    symbol?: string;
    decimals?: number;
    errorMessage?: string;
    isLoading?: boolean;
}

export const AmountReversed: FC<AmountReversedProps> = ({
    value,
    onChangeDirection,
    ticker,
    symbol,
    decimals,
    errorMessage,
    className,
    isLoading,
    ...props
}) => {
    if (errorMessage) {
        return (
            <div className={clsx(styles.container, className)} {...props}>
                {errorMessage}
            </div>
        );
    }

    return (
        <div className={clsx(styles.container, className)} {...props}>
            {isLoading ? (
                <Skeleton className={styles.skeleton} />
            ) : (
                <span>
                    {symbol}
                    {value ? formatLargeValue(value, decimals) : '0'}
                    {ticker ? ` ${ticker}` : ''}
                </span>
            )}

            {onChangeDirection && (
                <button type="button" className={styles.changeDirection} onClick={onChangeDirection}>
                    <FlipIcon size={16} />
                </button>
            )}
        </div>
    );
};
