/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import styles from './token-selector.module.css';
import { Button } from '../button';
import type { ButtonProps } from '../button';
import { Logo } from '../logo';

export interface TokenSelectorProps extends ButtonProps {
    title: string;
    icon?: string;
    iconFallback?: string;
}

export const TokenSelector: FC<TokenSelectorProps> = ({ title, icon, iconFallback, ...props }) => {
    return (
        <Button className={styles.tokenSelector} variant="gray" size="s" {...props}>
            <Logo size={24} src={icon} fallback={iconFallback || title[0]} alt={title} />

            <span className={styles.symbol}>{title}</span>

            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={styles.chevron}>
                <path
                    d="M1 1.5L6 6.5L11 1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Button>
    );
};
