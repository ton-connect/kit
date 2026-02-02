/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext } from 'react';

export type AppButtonVariant = 'standard' | 'small' | 'input';
export type AppButtonColorScheme = 'primary' | 'secondary' | 'action';

interface Context {
    variant: AppButtonVariant;
    colorScheme: AppButtonColorScheme;
    disabled: boolean;
}

export const AppButtonContext = createContext<Context>({
    variant: 'standard',
    colorScheme: 'primary',
    disabled: false,
});
