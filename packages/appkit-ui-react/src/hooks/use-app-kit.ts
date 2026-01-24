/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useContext } from 'react';

import { AppKitContext } from '../components/app-kit-provider';

export function useAppKit() {
    const context = useContext(AppKitContext);

    if (!context) {
        throw new Error('useAppKit must be used within an AppKitProvider');
    }

    return context;
}
