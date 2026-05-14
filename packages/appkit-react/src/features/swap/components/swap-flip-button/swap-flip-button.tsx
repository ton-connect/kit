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

/**
 * Props accepted by {@link SwapFlipButton} — the round button placed between the two {@link SwapField} rows that swaps the source and target tokens.
 *
 * @public
 * @category Type
 * @section Swap
 */
export interface SwapFlipButtonProps extends ComponentProps<'div'> {
    /** Called when the user clicks the button. Wire this to a handler that swaps the source/target tokens (e.g. `onFlip` from the swap context). */
    onClick?: () => void;
    /** When true, the icon is drawn in its rotated state — used to animate between flips. */
    rotated?: boolean;
}

/**
 * Round button rendered between the source and target {@link SwapField} rows. Clicking it flips the selected tokens. Visual rotation is driven by `rotated`.
 *
 * @sample docs/examples/src/appkit/components/swap#SWAP_FLIP_BUTTON
 *
 * @public
 * @category Component
 * @section Swap
 */
export const SwapFlipButton: FC<SwapFlipButtonProps> = ({ onClick, rotated, className, ...props }) => {
    return (
        <div className={clsx(styles.container, className)} {...props}>
            <Button className={clsx(styles.flipButton, rotated && styles.rotated)} onClick={onClick}>
                <FlipIcon />
            </Button>
        </div>
    );
};
