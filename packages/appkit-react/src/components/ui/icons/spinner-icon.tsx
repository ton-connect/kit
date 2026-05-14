/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { DEFAULT_ICON_SIZE } from './types';
import type { IconProps } from './types';

/**
 * Loading spinner icon — a three-quarter circle stroke. Animation must be applied via CSS by the caller.
 */
export const SpinnerIcon: FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
