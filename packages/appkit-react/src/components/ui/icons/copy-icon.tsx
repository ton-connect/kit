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
 * Copy icon — two overlapping rectangles indicating clipboard copy.
 */
export const CopyIcon: FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
    >
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path
            d="M3.5 10.5H3a1.5 1.5 0 0 1-1.5-1.5V3A1.5 1.5 0 0 1 3 1.5h6A1.5 1.5 0 0 1 10.5 3v.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
        />
    </svg>
);
