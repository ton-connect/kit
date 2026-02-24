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

export interface BlockProps extends ComponentProps<'div'> {
    direction?: 'row' | 'column';
}

export const Block: FC<BlockProps> = ({ className, direction = 'column', ...props }) => {
    return <div className={clsx(styles.block, direction === 'row' && styles.row, className)} {...props} />;
};
