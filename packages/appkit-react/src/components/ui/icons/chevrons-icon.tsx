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
 * Stacked up/down chevrons icon — used to signal select/dropdown affordance.
 */
export const ChevronsIcon: FC<IconProps> = ({ size = DEFAULT_ICON_SIZE, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
    >
        <path
            d="M6 13L9.29289 16.2929C9.68342 16.6834 10.3166 16.6834 10.7071 16.2929L14 13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M14 6.58578L10.7071 3.29289C10.3166 2.90237 9.68342 2.90237 9.29289 3.29289L6 6.58578"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
