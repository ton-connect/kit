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

import { Block } from '../../../../components/ui/block';
import styles from './balance-badge.module.css';
import { Logo } from '../../../../components/ui/logo';

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

/**
 * Compound component for rendering a token balance pill (icon + amount + symbol). Sub-components forward extra props to the underlying DOM element so callers can layer custom classes, click handlers, etc.
 *
 * @public
 * @category Component
 * @section Balances
 */
export const BalanceBadge = {
    /** Pill wrapper — renders a horizontal {@link Block} that hosts the icon and balance block. */
    Container: BalanceBadgeContainer,
    /** Token icon — re-exported {@link Logo} that draws the asset's image with a network badge. */
    Icon: Logo,
    /** Vertical block holding the balance amount and ticker symbol side by side. */
    BalanceBlock: BalanceBlock,
    /** Ticker symbol cell rendered next to the amount (e.g., `TON`, `USDT`). */
    Symbol: BalanceSymbol,
    /** Formatted balance number; takes a raw `balance` and `decimals` and renders the human-readable amount. */
    Balance: Balance,
};
