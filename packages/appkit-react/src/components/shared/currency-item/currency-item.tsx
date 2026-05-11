/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import { Logo } from '../../ui/logo';
import type { LogoProps } from '../../ui/logo';
import styles from './currency-item.module.css';

/**
 * Props accepted by {@link CurrencyItem} when used as a single-shot button. Passing `children` switches it into compound mode and bypasses these fields.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface CurrencyItemProps extends ComponentProps<'button'> {
    /** Token symbol (e.g., `"TON"`) — also used as the icon fallback and rendered in the secondary line. */
    ticker?: string;
    /** Human-readable token name shown as the primary line; falls back to `ticker` when absent. */
    name?: string;
    /** Main balance value shown on the right side (already-formatted string). */
    balance?: string;
    /** Optional secondary value (e.g., fiat equivalent) shown beneath the main balance. */
    underBalance?: string;
    /** URL of the token logo. */
    icon?: string;
    /** When true, renders a verified checkmark badge next to the name. */
    isVerified?: boolean;
}

const Container: FC<ComponentProps<'button'>> = ({ className, children, ...props }) => (
    <button className={clsx(styles.container, className)} {...props}>
        {children}
    </button>
);

const LogoWrapper: FC<LogoProps> = ({ className, ...props }) => (
    <Logo className={clsx(styles.icon, className)} size={40} {...props} />
);

const Info: FC<ComponentProps<'div'>> = ({ className, children, ...props }) => (
    <div className={clsx(styles.info, className)} {...props}>
        {children}
    </div>
);

const Header: FC<ComponentProps<'div'>> = ({ className, children, ...props }) => (
    <div className={clsx(styles.header, className)} {...props}>
        {children}
    </div>
);

const Name: FC<ComponentProps<'p'>> = ({ className, children, ...props }) => (
    <p className={clsx(styles.name, className)} {...props}>
        {children}
    </p>
);

const Ticker: FC<ComponentProps<'p'>> = ({ className, children, ...props }) => (
    <p className={clsx(styles.ticker, className)} {...props}>
        {children}
    </p>
);

const VerifiedBadge: FC<ComponentProps<'svg'>> = ({ className, ...props }) => (
    <svg className={clsx(styles.verified, className)} fill="currentColor" viewBox="0 0 20 20" {...props}>
        <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
        />
    </svg>
);

const RightSide: FC<ComponentProps<'div'>> = ({ className, children, ...props }) => (
    <div className={clsx(styles.rightSide, className)} {...props}>
        {children}
    </div>
);

const MainBalance: FC<ComponentProps<'p'>> = ({ className, children, ...props }) => (
    <p className={clsx(styles.mainBalance, className)} {...props}>
        {children}
    </p>
);

const UnderBalance: FC<ComponentProps<'p'>> = ({ className, children, ...props }) => (
    <p className={clsx(styles.underBalance, className)} {...props}>
        {children}
    </p>
);

const CurrencyItemRoot: FC<CurrencyItemProps> = ({
    ticker,
    name,
    balance,
    underBalance,
    icon,
    isVerified,
    children,
    ...props
}) => {
    if (children) {
        return <Container {...props}>{children}</Container>;
    }

    return (
        <Container {...props}>
            {(icon || ticker) && <LogoWrapper src={icon} fallback={ticker?.[0]} alt={ticker} />}

            <Info>
                <Header>
                    <Name>{name || ticker}</Name>
                    {isVerified && <VerifiedBadge />}
                </Header>

                <Ticker>
                    {ticker} {name && ticker && <>• {name}</>}
                </Ticker>
            </Info>

            {(balance || underBalance) && (
                <RightSide>
                    {balance && <MainBalance>{balance}</MainBalance>}
                    {underBalance && <UnderBalance>{underBalance}</UnderBalance>}
                </RightSide>
            )}
        </Container>
    );
};

/**
 * Compound row used inside currency/token select lists: shows a token logo, name + ticker, optional verified badge, and an optional balance / under-balance on the right. Pass top-level props for the default layout, or pass `children` made of the sub-components for full control.
 *
 * @public
 * @category Component
 * @section Shared
 */
export const CurrencyItem = Object.assign(CurrencyItemRoot, {
    /** Root `<button>` wrapper — receives all native button props. */
    Container,
    /** Token logo cell rendered as a 40px {@link Logo}. */
    Logo: LogoWrapper,
    /** Vertical block holding the {@link Header} and {@link Ticker}. */
    Info,
    /** Verified checkmark badge — rendered next to the name when `isVerified` is set. */
    VerifiedBadge,
    /** Top line of `Info` (name + verified badge). */
    Header,
    /** Primary text line — defaults to the token name, falling back to the ticker when no name is provided. */
    Name,
    /** Secondary text line — renders the ticker and, when both ticker and name are present, appends `• {name}`. */
    Ticker,
    /** Right-aligned column for balance values. */
    RightSide,
    /** Primary balance number (top of `RightSide`). */
    MainBalance,
    /** Secondary balance value (e.g., fiat) shown under `MainBalance`. */
    UnderBalance,
});
