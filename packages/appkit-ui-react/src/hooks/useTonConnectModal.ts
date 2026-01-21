/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletsModal, WalletsModalState } from '@ton/appkit-ui';
import { useEffect, useState } from 'react';

import { useTonConnectUI } from './useTonConnectUI';

/**
 * Use it to get access to the open/close modal functions.
 */
export function useTonConnectModal(): Omit<WalletsModal, 'onStateChange'> {
    const [tonConnectUI] = useTonConnectUI();
    const [state, setState] = useState(tonConnectUI?.modal.state || null);

    useEffect(() => {
        if (tonConnectUI) {
            setState(tonConnectUI.modal.state);
            return tonConnectUI.onModalStateChange((value: WalletsModalState) => {
                setState(value);
            });
        }
    }, [tonConnectUI]);

    return {
        state: state,
        open: () => tonConnectUI?.modal.open(),
        close: () => tonConnectUI?.modal.close(),
    };
}
