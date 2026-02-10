/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Preview } from '@storybook/react';
import type { Decorator } from '@storybook/react';
import React from 'react';

import { I18nProvider } from '../src/providers/i18n-provider';
import '../src/styles/index.css';

const withI18n: Decorator = (Story) => (
    <I18nProvider>
        <Story />
    </I18nProvider>
);

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        backgrounds: {
            default: 'dark',
            values: [
                { name: 'dark', value: '#1a1a2e' },
                { name: 'light', value: '#ffffff' },
                { name: 'neutral', value: '#f5f5f5' },
            ],
        },
    },
    decorators: [withI18n],
};

export default preview;
