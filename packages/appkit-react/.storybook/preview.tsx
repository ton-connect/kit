/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Preview } from '@storybook/react-vite';
import type { Decorator } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { AppKitProvider } from '../src/providers/app-kit-provider';
import { I18nProvider } from '../src/providers/i18n-provider';
import { appKit } from './app-kit';
import theme from './theme';

import '../src/styles/index.css';

const queryClient = new QueryClient();

const withAppKit: Decorator = (Story) => (
    <QueryClientProvider client={queryClient}>
        <AppKitProvider appKit={appKit}>
            <Story />
        </AppKitProvider>
    </QueryClientProvider>
);

const withI18n: Decorator = (Story) => (
    <I18nProvider>
        <Story />
    </I18nProvider>
);

const withTheme: Decorator = (Story, context) => {
    const theme = context.globals.theme;

    React.useEffect(() => {
        document.documentElement.setAttribute('data-ta-theme', theme);
    }, [theme]);

    return (
        <div
            style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: theme === 'dark' ? '#141416' : '#e2e2e2',
                color: 'var(--ta-color-text)',
            }}
        >
            <Story />
        </div>
    );
};

const preview: Preview = {
    tags: ['autodocs'],
    globalTypes: {
        theme: {
            name: 'Theme',
            description: 'Global theme for components',
            defaultValue: 'dark',
            toolbar: {
                icon: 'circlehollow',
                items: [
                    { value: 'light', icon: 'sun', title: 'Light' },
                    { value: 'dark', icon: 'moon', title: 'Dark' },
                ],
            },
        },
    },
    parameters: {
        docs: {
            theme,
        },
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
    decorators: [withTheme, withI18n, withAppKit],
};

export default preview;
