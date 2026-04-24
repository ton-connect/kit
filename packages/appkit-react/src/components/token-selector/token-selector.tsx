/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import clsx from 'clsx';

import styles from './token-selector.module.css';
import { Button } from '../button';
import type { ButtonProps } from '../button';
import { Logo } from '../logo';
import { LogoWithNetwork } from '../logo-with-network';

export interface TokenSelectorProps extends ButtonProps {
    title: string;
    icon?: string;
    iconFallback?: string;
    /** When provided, renders a network badge overlay on the icon */
    networkIcon?: string;
    /** Hide chevron and suppress click handling — use when there's nothing to pick */
    readOnly?: boolean;
}

export const TokenSelector: FC<TokenSelectorProps> = ({
    title,
    icon,
    iconFallback,
    networkIcon,
    readOnly,
    onClick,
    className,
    ...props
}) => {
    return (
        <Button
            className={clsx(styles.tokenSelector, readOnly && styles.readOnly, className)}
            variant="gray"
            size="s"
            onClick={readOnly ? undefined : onClick}
            {...props}
        >
            {networkIcon ? (
                <LogoWithNetwork
                    size={24}
                    src={icon}
                    fallback={iconFallback || title[0]}
                    alt={title}
                    networkSrc={networkIcon}
                />
            ) : (
                <Logo size={24} src={icon} fallback={iconFallback || title[0]} alt={title} />
            )}

            <span className={styles.symbol}>{title}</span>

            {!readOnly && (
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={styles.chevron}>
                    <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </Button>
    );
};
