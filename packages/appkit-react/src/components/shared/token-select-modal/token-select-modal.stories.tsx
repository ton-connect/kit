/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { STORY_TOKENS } from '../../../storybook/fixtures/tokens';
import { Button } from '../../ui/button';
import { TokenSelectModal } from './token-select-modal';
import type { AppkitUIToken } from '../../../types/appkit-ui-token';

const meta: Meta<typeof TokenSelectModal> = {
    title: 'Components/Shared/TokenSelectModal',
    component: TokenSelectModal,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TokenSelectModal>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        const [selected, setSelected] = useState<AppkitUIToken | null>(null);

        return (
            <>
                <Button onClick={() => setOpen(true)}>
                    {selected ? `Selected: ${selected.symbol}` : 'Select Token'}
                </Button>
                <TokenSelectModal
                    open={open}
                    onClose={() => setOpen(false)}
                    tokens={STORY_TOKENS}
                    onSelect={setSelected}
                    title="Select Token"
                    searchPlaceholder="Search by name or symbol"
                />
            </>
        );
    },
};

export const Empty: Story = {
    render: () => {
        const [open, setOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setOpen(true)}>Open Empty List</Button>
                <TokenSelectModal
                    open={open}
                    onClose={() => setOpen(false)}
                    tokens={[]}
                    onSelect={() => {}}
                    title="Select Token"
                    searchPlaceholder="Search by name or symbol"
                />
            </>
        );
    },
};
