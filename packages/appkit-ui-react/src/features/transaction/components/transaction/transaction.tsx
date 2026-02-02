/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import type { SendTransactionParameters, SendTransactionReturnType } from '@ton/appkit';

import { TransactionButton } from '../transaction-button';
import { TransactionProvider } from '../transaction-provider';
import styles from './transaction.module.css';

export interface TransactionProps extends PropsWithChildren {
    /** The transaction request parameters */
    getTransactionRequest: () => Promise<SendTransactionParameters | null>;
    /** CSS class name */
    className?: string;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Callback when the transaction is successful */
    onSuccess?: (response: SendTransactionReturnType) => void;
    /** Disable the button/interaction */
    disabled?: boolean;
}

export const Transaction: FC<TransactionProps> = ({
    getTransactionRequest,
    children,
    className,
    onError,
    onSuccess,
    disabled = false,
}) => {
    return (
        <TransactionProvider
            getTransactionRequest={getTransactionRequest}
            onError={onError}
            onSuccess={onSuccess}
            disabled={disabled}
            className={className}
        >
            <div className={clsx(styles.transaction, className)}>{children ?? <TransactionButton />}</div>
        </TransactionProvider>
    );
};
