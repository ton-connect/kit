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
import { TransactionProgressProvider, useTransactionProgressContext } from './transaction-progress-provider';
import type { TransactionProgressContextValue } from './transaction-progress-provider';
import { TransactionProgressIcon } from './transaction-progress-icons';
import styles from './transaction-progress.module.css';

export interface TransactionProgressTexts {
    pending: string;
    completed: string;
    failed: string;
}

export interface TransactionProgressRenderProps extends TransactionProgressContextValue {
    texts: TransactionProgressTexts;
}

export interface TransactionProgressProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** BOC of the transaction to strictly track status */
    boc: string;
    /** Render props function for full control over rendering */
    children?: (props: TransactionProgressRenderProps) => ReactNode;
    /** Allows targeting specific internal elements for styling */
    classNames?: {
        container?: string;
        icon?: string;
        message?: string;
    };
}

export const TransactionProgressContent: FC<Omit<TransactionProgressProps, 'boc'>> = ({
    children,
    className,
    classNames = {},
    ...props
}) => {
    const context = useTransactionProgressContext();
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
                <TransactionProgressIcon status={status} isError={!!error} />
            </div>

            <div className={clsx(styles.message, classNames.message)}>
                {messageText} {progressText}
            </div>
        </div>
    );
};

export const TransactionProgress: FC<TransactionProgressProps> = ({ boc, ...rest }) => {
    return (
        <TransactionProgressProvider boc={boc}>
            <TransactionProgressContent {...rest} />
        </TransactionProgressProvider>
    );
};
