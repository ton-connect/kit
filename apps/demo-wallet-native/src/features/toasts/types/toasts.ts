/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import type { ToastConfigParams } from 'react-native-toast-message/lib/src/types';

export type AppToastType = 'success' | 'info' | 'error' | 'loading';
export interface AppToastProps {
    ticker?: string;
}
export type AppToastConfigParams = ToastConfigParams<AppToastProps>;
export type AppToastConfig = Record<AppToastType, (params: AppToastConfigParams) => React.ReactNode>;
