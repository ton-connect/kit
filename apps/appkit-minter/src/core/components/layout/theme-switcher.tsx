/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/core/hooks';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            {theme === 'light' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
