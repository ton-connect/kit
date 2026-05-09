/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCustomProvider } from '@ton/appkit';
import type { CustomProvider } from '@ton/appkit';

import { useAppKit } from '../../../hooks/use-app-kit';

/**
 * Hook to get a registered custom provider by id.
 */
export const useCustomProvider = <T extends CustomProvider = CustomProvider>(id: string): T | undefined => {
    const appKit = useAppKit();
    return getCustomProvider<T>(appKit, { id });
};
