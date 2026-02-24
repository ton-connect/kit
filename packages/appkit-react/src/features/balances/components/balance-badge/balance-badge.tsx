/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatUnits } from '@ton/appkit';
import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import { Block } from '../../../../components/block';
import styles from './balance-badge.module.css';
import { CircleIcon } from '../../../../components/circle-icon';

const BalanceBadgeContainer: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    return <Block direction="row" className={clsx(styles.balance, className)} {...props} />;
};

const BalanceBlock: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    return <div className={clsx(styles.balanceContainer, className)} {...props} />;
};

const Balance: FC<ComponentProps<'span'> & { balance: string; decimals: number }> = ({
    balance,
    decimals,
    ...props
}) => {
    return <span {...props}>{balance ? formatUnits(balance, decimals) : '0'}</span>;
};

const BalanceSymbol: FC<ComponentProps<'span'> & { symbol: string }> = ({ className, symbol, ...props }) => {
    return (
        <span className={clsx(styles.ticker, className)} {...props}>
            {symbol}
        </span>
    );
};

export const BalanceBadge = {
    Container: BalanceBadgeContainer,
    Icon: CircleIcon,
    BalanceBlock: BalanceBlock,
    Symbol: BalanceSymbol,
    Balance: Balance,
};
