/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, HTMLAttributes } from 'react';

import { cn } from '@/core/lib/utils';

/**
 * Reusable animated skeleton placeholder. A gray band sweeps across a gray base
 * (see the `.skeleton-shimmer` rule in App.css) — within the app's gray palette.
 * Size and shape come from the passed className (width/height/rounding).
 *
 * @example <Skeleton className="h-4 w-24 rounded" />
 */
export const Skeleton: FC<HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div aria-hidden className={cn('skeleton-shimmer rounded-md', className)} {...props} />
);
