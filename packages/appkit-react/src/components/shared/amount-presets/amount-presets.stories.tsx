/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { AmountPresets } from './amount-presets';

const meta: Meta<typeof AmountPresets> = {
    title: 'Components/Shared/AmountPresets',
    component: AmountPresets,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AmountPresets>;

export const Default: Story = {
    args: {
        presets: [
            { label: '10%', amount: '10' },
            { label: '50%', amount: '50' },
            { label: '75%', amount: '75' },
            { label: 'MAX', amount: '100' },
        ],
        onPresetSelect: fn(),
    },
};

export const WithCurrencySymbol: Story = {
    args: {
        presets: [
            { label: '10', amount: '10' },
            { label: '50', amount: '50' },
            { label: '100', amount: '100' },
            { label: '500', amount: '500' },
        ],
        currencySymbol: '$',
        onPresetSelect: fn(),
    },
};
