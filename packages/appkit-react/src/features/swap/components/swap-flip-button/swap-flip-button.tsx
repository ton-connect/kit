/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import styles from './swap-flip-button.module.css';
import { Button } from '../../../../components/button';

export interface SwapFlipButtonProps extends ComponentProps<'div'> {
    onClick?: () => void;
    rotated?: boolean;
}

export const SwapFlipButton: FC<SwapFlipButtonProps> = ({ onClick, rotated, ...props }) => {
    return (
        <div className={styles.container} {...props}>
            <Button className={clsx(styles.flipButton, rotated && styles.rotated)} onClick={onClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7 19V4M7 4L3.5 7.5M7 4L10.5 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M17 5V20M17 20L13.5 16.5M17 20L20.5 16.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </Button>
        </div>
    );
};
