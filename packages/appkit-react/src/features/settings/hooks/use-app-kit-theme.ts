/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from 'react';

export type AppKitTheme = 'light' | 'dark' | string;

export function useAppKitTheme() {
    const [theme, setTheme] = useState<AppKitTheme>('light');

    useEffect(() => {
        const body = document.body;
        body.dataset['taTheme'] = theme;
    }, [theme]);

    return [theme, setTheme] as const;
}
