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
import { Button } from '../../../../components/ui/button';
import { FlipIcon } from '../../../../components/ui/icons';

export interface SwapFlipButtonProps extends ComponentProps<'div'> {
    onClick?: () => void;
    rotated?: boolean;
}

export const SwapFlipButton: FC<SwapFlipButtonProps> = ({ onClick, rotated, className, ...props }) => {
    return (
        <div className={clsx(styles.container, className)} {...props}>
            <Button className={clsx(styles.flipButton, rotated && styles.rotated)} onClick={onClick}>
                <FlipIcon />
            </Button>
        </div>
    );
};
