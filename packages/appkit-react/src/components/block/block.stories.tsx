/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';

import { Block } from './block';

const meta: Meta<typeof Block> = {
    title: 'Private/Components/Block',
    component: Block,
    tags: ['autodocs'],
    argTypes: {
        direction: {
            control: 'radio',
            options: ['row', 'column'],
        },
    },
};

export default meta;

type Story = StoryObj<typeof Block>;

export const Column: Story = {
    args: {
        direction: 'column',
        children: (
            <>
                <div style={{ padding: '8px', background: '#0098EB', color: 'white' }}>Item 1</div>
                <div style={{ padding: '8px', background: '#0098EB', color: 'white' }}>Item 2</div>
                <div style={{ padding: '8px', background: '#0098EB', color: 'white' }}>Item 3</div>
            </>
        ),
    },
};

export const Row: Story = {
    args: {
        direction: 'row',
        children: (
            <>
                <div style={{ padding: '8px', background: '#0098EB', color: 'white' }}>Item 1</div>
                <div style={{ padding: '8px', background: '#0098EB', color: 'white' }}>Item 2</div>
                <div style={{ padding: '8px', background: '#0098EB', color: 'white' }}>Item 3</div>
            </>
        ),
    },
};
