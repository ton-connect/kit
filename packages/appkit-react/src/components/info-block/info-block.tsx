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

export const InfoBlock = {
    Container,
    Row,
    Label,
    Value,
    LabelSkeleton,
    ValueSkeleton,
};
