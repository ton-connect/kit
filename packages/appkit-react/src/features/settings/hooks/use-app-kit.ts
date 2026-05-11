/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useContext } from 'react';

import { AppKitContext } from '../../../providers/app-kit-provider';

/**
 * Read the {@link appkit:AppKit} instance hosted by {@link AppKitProvider}; throws when the hook is rendered outside the provider tree.
 *
 * @returns The AppKit instance shared with descendant hooks/components.
 *
 * @public
 * @category Hook
 * @section Settings
 */
export const useAppKit = () => {
    const context = useContext(AppKitContext);

    if (!context) {
        throw new Error('useAppKit must be used within an AppKitProvider');
    }

    return context;
};
