/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useContext, useEffect } from 'react';
import { useAppKitTheme } from '@ton/appkit-ui-react';

import { ThemeProviderContext } from '@/core/components/layout/theme-provider';

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);
    const [, setTheme] = useAppKitTheme();

    if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

    useEffect(() => {
        setTheme(context.theme);
    }, [context.theme]);

    return context;
};
