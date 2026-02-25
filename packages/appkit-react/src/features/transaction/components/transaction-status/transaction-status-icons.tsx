/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';
import type { TransactionStatus } from '@ton/walletkit';

import styles from './transaction-status.module.css';

export interface TransactionStatusIconsProps extends ComponentProps<'svg'> {
    status: TransactionStatus;
    isError: boolean;
}

const SpinnerIcon: FC<ComponentProps<'svg'>> = ({ className }) => (
    <svg
        className={clsx(styles.spinner, className)}
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const SuccessIcon: FC<ComponentProps<'svg'>> = ({ className }) => (
    <svg
        className={clsx(styles.success, className)}
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const FailedIcon: FC<ComponentProps<'svg'>> = ({ className }) => (
    <svg
        className={clsx(styles.failed, className)}
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

export const TransactionStatusIcon: FC<TransactionStatusIconsProps> = ({ status, isError, ...props }) => {
    if (status === 'completed') return <SuccessIcon {...props} />;

    if (status === 'failed' || isError) return <FailedIcon {...props} />;

    return <SpinnerIcon {...props} />;
};
