/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Moon, Sun } from 'lucide-react';
import { Button } from '@ton/appkit-react';

import { useTheme } from '@/core/hooks';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <Button size="icon" variant="ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
