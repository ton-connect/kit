/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { forwardRef } from 'react';
import type { ComponentProps } from 'react';
import clsx from 'clsx';

import styles from './skeleton.module.css';

/**
 * Props accepted by {@link Skeleton}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface SkeletonProps extends ComponentProps<'div'> {
    /** Width of the placeholder. Accepts any valid CSS length or a number (interpreted as pixels). */
    width?: string | number;
    /** Height of the placeholder. Accepts any valid CSS length or a number (interpreted as pixels). */
    height?: string | number;
}

/**
 * Animated placeholder block used while data is loading. Supply `width` / `height` to match the dimensions of the eventual content.
 *
 * @public
 * @category Component
 * @section UI
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, width, height, style, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(styles.skeleton, className)}
                style={{ width, height, ...style }}
                {...props}
            />
        );
    },
);

Skeleton.displayName = 'Skeleton';
