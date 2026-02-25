/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from 'react';
import type { FC, ReactNode, ComponentProps } from 'react';
import { clsx } from 'clsx';

import { useI18n } from '../../../../hooks/use-i18n';
import { TransactionStatusProvider, useTransactionStatusContext } from './transaction-status-provider';
import type { TransactionStatusContextValue } from './transaction-status-provider';
import { TransactionStatusIcon } from './transaction-status-icons';
import styles from './transaction-status.module.css';

export interface TransactionStatusTexts {
    pending: string;
    completed: string;
    failed: string;
}

export interface TransactionStatusRenderProps extends TransactionStatusContextValue {
    texts: TransactionStatusTexts;
}

export interface TransactionStatusProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** BOC of the transaction to strictly track status */
    boc: string;
    /** Render props function for full control over rendering */
    children?: (props: TransactionStatusRenderProps) => ReactNode;
    /** Allows targeting specific internal elements for styling */
    classNames?: {
        container?: string;
        icon?: string;
        message?: string;
    };
}

export const TransactionStatusContent: FC<Omit<TransactionStatusProps, 'boc'>> = ({
    children,
    className,
    classNames = {},
    ...props
}) => {
    const context = useTransactionStatusContext();
    const { status, onchainMessages, totalMessages, error } = context;
    const { t } = useI18n();

    const texts = useMemo(
        () => ({
            pending: t('transaction.status.pending'),
            completed: t('transaction.status.completed'),
            failed: t('transaction.status.failed'),
        }),
        [t],
    );

    if (children) {
        return <>{children({ ...context, texts })}</>;
    }

    const isPending = status === 'pending' && !error;
    const isCompleted = status === 'completed';
    const isFailed = status === 'failed' || !!error;

    let messageText = texts.pending;
    if (isCompleted) messageText = texts.completed;
    if (isFailed) messageText = texts.failed;

    let progressText = null;
    if (isPending && totalMessages > 0) {
        progressText = `(${onchainMessages} / ${totalMessages})`;
    }

    return (
        <div className={clsx(styles.container, className, classNames.container)} {...props}>
            <div className={clsx(styles.iconContainer, classNames.icon)}>
                <TransactionStatusIcon status={status} isError={!!error} />
            </div>

            <div className={clsx(styles.message, classNames.message)}>
                {messageText} {progressText}
            </div>
        </div>
    );
};

export const TransactionStatus: FC<TransactionStatusProps> = ({ boc, ...rest }) => {
    return (
        <TransactionStatusProvider boc={boc}>
            <TransactionStatusContent {...rest} />
        </TransactionStatusProvider>
    );
};
