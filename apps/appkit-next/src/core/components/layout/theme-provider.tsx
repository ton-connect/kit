/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import React, { createContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';
type ThemeOption = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: ThemeOption;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: ThemeOption;
    calculatedTheme: Theme;
    setTheme: (theme: ThemeOption) => void;
};

const initialState: ThemeProviderState = {
    theme: 'system',
    calculatedTheme: 'light',
    setTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'vite-ui-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<ThemeOption>(() => {
        if (typeof window !== 'undefined') {
            return (window.localStorage.getItem(storageKey) as ThemeOption) || defaultTheme;
        }
        return defaultTheme;
    });
    const calculatedTheme: Theme = useMemo(() => {
        if (theme === 'system') {
            if (typeof window !== 'undefined') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return 'light';
        }
        return theme === 'dark' ? 'dark' : 'light';
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

            root.classList.add(systemTheme);
            root.setAttribute('data-theme', systemTheme);
            return;
        }

        root.classList.add(theme);
        if (theme === 'light') {
            root.classList.remove('dark');
        }
        root.setAttribute('data-theme', theme);
    }, [theme]);

    const value = {
        theme,
        calculatedTheme,
        setTheme: (theme: ThemeOption) => {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(storageKey, theme);
            }
            setTheme(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider value={value} {...props}>
            {children}
        </ThemeProviderContext.Provider>
    );
}
