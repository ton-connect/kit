/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useContext } from 'react';
import type { TonConnectUI, TonConnectUiOptions } from '@ton/appkit-ui';

import { TonConnectUIContext } from '../components/TonConnectUIProvider';
import { checkProvider } from '../utils/errors';
import { isServerSide } from '../utils/web';

/**
 * Use it to get access to the `TonConnectUI` instance and UI options updating function.
 */
export function useTonConnectUI(): [TonConnectUI, (options: TonConnectUiOptions) => void] {
    const tonConnectUI = useContext(TonConnectUIContext);
    const setOptions = useCallback(
        (options: TonConnectUiOptions) => {
            if (tonConnectUI) {
                tonConnectUI!.uiOptions = options;
            }
        },
        [tonConnectUI],
    );

    if (isServerSide()) {
        return [null as unknown as TonConnectUI, () => {}];
    }

    checkProvider(tonConnectUI);
    return [tonConnectUI!, setOptions];
}
