/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Collapsible } from './collapsible';

const meta: Meta<typeof Collapsible> = {
    title: 'Public/Components/Collapsible',
    component: Collapsible,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <div style={{ maxWidth: 320 }}>
                <button type="button" onClick={() => setOpen((v) => !v)}>
                    {open ? 'Collapse' : 'Expand'}
                </button>
                <Collapsible open={open}>
                    <div style={{ padding: 16 }}>
                        <p>This content is collapsible.</p>
                        <p>It animates from zero height to its natural height.</p>
                    </div>
                </Collapsible>
            </div>
        );
    },
};
