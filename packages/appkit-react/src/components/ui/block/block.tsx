/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import styles from './block.module.css';

/**
 * Props accepted by {@link Block}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface BlockProps extends ComponentProps<'div'> {
    /** Flex direction of the block. Defaults to `'column'`. */
    direction?: 'row' | 'column';
}

/**
 * Flex container primitive — renders a `<div>` that lays its children out vertically (`'column'`) or horizontally (`'row'`).
 *
 * @public
 * @category Component
 * @section UI
 */
export const Block: FC<BlockProps> = ({ className, direction = 'column', ...props }) => {
    return <div className={clsx(styles.block, direction === 'row' && styles.row, className)} {...props} />;
};
