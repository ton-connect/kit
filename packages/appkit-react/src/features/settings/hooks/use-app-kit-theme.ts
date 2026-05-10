/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';

/**
 * Theme value accepted by {@link useAppKitTheme} — `'light'`, `'dark'`, or any custom string mapped to a `data-ta-theme` token in the host's CSS.
 *
 * @public
 * @category Type
 * @section Settings
 */
export type AppKitTheme = 'light' | 'dark' | string;

/**
 * State hook that mirrors the active appkit-react theme onto `document.body[data-ta-theme]` — returns a `[theme, setTheme]` tuple just like `useState`.
 *
 * @returns Tuple `[theme, setTheme]` for reading and switching the active theme.
 *
 * @public
 * @category Hook
 * @section Settings
 */
export const useAppKitTheme = () => {
    const [theme, setTheme] = useState<AppKitTheme>('light');

    useEffect(() => {
        const body = document.body;
        body.dataset['taTheme'] = theme;
    }, [theme]);

    return [theme, setTheme] as const;
};
