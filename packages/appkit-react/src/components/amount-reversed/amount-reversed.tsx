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

export interface AmountReversedProps extends ComponentProps<'div'> {
    value: string;
    onChangeDirection?: () => void;
    ticker?: string;
    symbol?: string;
    decimals?: number;
    errorMessage?: string;
}

export const AmountReversed: FC<AmountReversedProps> = ({
    value,
    onChangeDirection,
    ticker,
    symbol,
    decimals,
    errorMessage,
    className,
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
            <span>
                {symbol}
                {value ? formatLargeValue(value, decimals) : '0'}
                {ticker ? ` ${ticker}` : ''}
            </span>

            {onChangeDirection && (
                <button type="button" className={styles.changeDirection} onClick={onChangeDirection}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M4 10V2M4 2L1.5 4.5M4 2L6.5 4.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M12 6V14M12 14L9.5 11.5M12 14L14.5 11.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
};
