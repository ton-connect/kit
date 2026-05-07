/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CenteredAmountInput } from './centered-amount-input';

const meta: Meta<typeof CenteredAmountInput> = {
    title: 'Components/UI/CenteredAmountInput',
    component: CenteredAmountInput,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CenteredAmountInput>;

const Template = (props: { symbol?: string; ticker?: string; placeholder?: string; width?: number }) => {
    const [value, setValue] = useState('');
    return (
        <div style={{ width: props.width ?? 370 }}>
            <CenteredAmountInput
                value={value}
                onValueChange={setValue}
                symbol={props.symbol}
                ticker={props.ticker}
                placeholder={props.placeholder}
            />
        </div>
    );
};

export const WithSymbol: Story = {
    render: () => <Template symbol="$" />,
};

export const WithTicker: Story = {
    render: () => <Template ticker="TON" />,
};

export const WithSymbolAndTicker: Story = {
    render: () => <Template symbol="$" ticker="USD" />,
};

export const NarrowContainer: Story = {
    render: () => <Template symbol="€" ticker="EUR" width={200} />,
};
