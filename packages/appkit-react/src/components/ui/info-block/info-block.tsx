/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import styles from './info-block.module.css';
import { Skeleton } from '../skeleton';
import type { SkeletonProps } from '../skeleton';

const Container: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    return <div className={clsx(styles.container, className)} {...props} />;
};

const Row: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
    return <div className={clsx(styles.row, className)} {...props} />;
};

const Label: FC<ComponentProps<'span'>> = ({ className, ...props }) => {
    return <span className={clsx(styles.label, className)} {...props} />;
};

const Value: FC<ComponentProps<'span'>> = ({ className, ...props }) => {
    return <span className={clsx(styles.value, className)} {...props} />;
};

const LabelSkeleton: FC<SkeletonProps> = ({ width = 64, height = '1lh', ...props }) => {
    return <Skeleton width={width} height={height} {...props} />;
};

const ValueSkeleton: FC<SkeletonProps> = ({ width = 80, height = '1lh', ...props }) => {
    return <Skeleton width={width} height={height} {...props} />;
};

/**
 * Compound component for rendering a stacked list of label/value rows (e.g., transaction details, settings summaries). Sub-components forward extra props to the underlying DOM element so callers can layer custom classes and handlers.
 *
 * @sample docs/examples/src/appkit/components/ui#INFO_BLOCK
 *
 * @public
 * @category Component
 * @section UI
 */
export const InfoBlock = {
    /** Outer wrapper — vertical container that hosts the rows. */
    Container,
    /** Horizontal row that pairs a label with a value. */
    Row,
    /** Label cell — typically the muted descriptor on the left. */
    Label,
    /** Value cell — typically the emphasized content on the right. */
    Value,
    /** Skeleton placeholder for a {@link InfoBlock.Label} while data is loading. Defaults to `width=64`, `height='1lh'`. */
    LabelSkeleton,
    /** Skeleton placeholder for a {@link InfoBlock.Value} while data is loading. Defaults to `width=80`, `height='1lh'`. */
    ValueSkeleton,
};
