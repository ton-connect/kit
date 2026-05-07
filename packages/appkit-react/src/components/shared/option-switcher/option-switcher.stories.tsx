/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { OptionSwitcher } from './option-switcher';

const meta: Meta<typeof OptionSwitcher> = {
    title: 'Components/Shared/OptionSwitcher',
    component: OptionSwitcher,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof OptionSwitcher>;

const PROVIDER_OPTIONS = [
    { value: 'stonfi', label: 'STON.fi' },
    { value: 'dedust', label: 'DeDust' },
    { value: 'omniston', label: 'Omniston' },
];

const SLIPPAGE_OPTIONS = [
    { value: '50', label: '0.50%' },
    { value: '100', label: '1.00%' },
    { value: '200', label: '2.00%' },
];

export const Default: Story = {
    render: () => {
        const Wrapper = () => {
            const [value, setValue] = useState('stonfi');
            return <OptionSwitcher value={value} options={PROVIDER_OPTIONS} onChange={setValue} />;
        };
        return <Wrapper />;
    },
};

export const Disabled: Story = {
    args: {
        value: 'stonfi',
        options: PROVIDER_OPTIONS,
        onChange: fn(),
        disabled: true,
    },
};

export const Slippage: Story = {
    render: () => {
        const Wrapper = () => {
            const [value, setValue] = useState('50');
            return <OptionSwitcher value={value} options={SLIPPAGE_OPTIONS} onChange={setValue} />;
        };
        return <Wrapper />;
    },
};
