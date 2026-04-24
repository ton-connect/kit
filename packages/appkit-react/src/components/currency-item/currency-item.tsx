/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import { Logo } from '../logo';
import type { LogoProps } from '../logo';
import styles from './currency-item.module.css';

export interface CurrencyItemProps extends ComponentProps<'button'> {
    ticker?: string;
    name?: string;
    balance?: string;
    underBalance?: string;
    icon?: string;
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

export const CurrencyItem = Object.assign(CurrencyItemRoot, {
    Container,
    Logo: LogoWrapper,
    Info,
    VerifiedBadge,
    Header,
    Name,
    Ticker,
    RightSide,
    MainBalance,
    UnderBalance,
});
