/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';

import styles from './token-selector.module.css';
import { Button } from '../../../../components/button';

export interface TokenSelectorProps {
    symbol: string;
    icon: ReactNode;
    onClick?: () => void;
}

export const TokenSelector: FC<TokenSelectorProps> = ({ symbol, icon, onClick }) => {
    return (
        <Button className={styles.tokenSelector} onClick={onClick} variant="gray" size="s">
            <div className={styles.tokenIcon}>{icon}</div>
            <span>{symbol}</span>
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
