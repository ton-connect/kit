/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Ionicons } from '@expo/vector-icons';

import type { StatusIconProps } from './info-block';

import type { PropsOf } from '@/core/utils/component-props';

export const getIconName = (status: StatusIconProps['status']): PropsOf<typeof Ionicons>['name'] => {
    switch (status) {
        case 'success':
            return 'checkmark-circle-outline';
        case 'error':
            return 'alert-circle-outline';
        case 'processing':
        default:
            return 'arrow-down-circle-outline';
    }
};
