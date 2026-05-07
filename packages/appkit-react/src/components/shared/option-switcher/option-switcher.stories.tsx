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

export const Default: Story = {
    args: {
        value: 'STON.fi',
        onClick: fn(),
    },
};

export const Disabled: Story = {
    args: {
        value: 'STON.fi',
        disabled: true,
        onClick: fn(),
    },
};

export const SingleOption: Story = {
    args: {
        value: 'STON.fi',
        singleOption: true,
        onClick: fn(),
    },
};

const SLIPPAGE_PRESETS = ['0.50%', '1.00%', '2.00%'];

export const Cycling: Story = {
    render: () => {
        const Wrapper = () => {
            const [index, setIndex] = useState(0);
            return (
                <OptionSwitcher
                    value={SLIPPAGE_PRESETS[index]!}
                    onClick={() => setIndex((i) => (i + 1) % SLIPPAGE_PRESETS.length)}
                />
            );
        };
        return <Wrapper />;
    },
};
