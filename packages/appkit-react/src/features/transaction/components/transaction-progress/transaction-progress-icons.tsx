/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';
import type { TransactionStatus } from '@ton/appkit';

import { FailedIcon, SpinnerIcon, SuccessIcon } from '../../../../components/ui/icons';
import styles from './transaction-progress.module.css';

export interface TransactionProgressIconsProps extends ComponentProps<'svg'> {
    status: TransactionStatus;
    isError: boolean;
}

const STATUS_ICON_SIZE = 48;

export const TransactionProgressIcon: FC<TransactionProgressIconsProps> = ({
    status,
    isError,
    className,
    ...props
}) => {
    if (status === 'completed')
        return <SuccessIcon size={STATUS_ICON_SIZE} className={clsx(styles.success, className)} {...props} />;

    if (status === 'failed' || isError)
        return <FailedIcon size={STATUS_ICON_SIZE} className={clsx(styles.failed, className)} {...props} />;

    return <SpinnerIcon size={STATUS_ICON_SIZE} className={clsx(styles.spinner, className)} {...props} />;
};
