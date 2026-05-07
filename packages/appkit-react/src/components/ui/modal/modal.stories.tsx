/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Modal } from './modal';
import { Button } from '../button';

const meta: Meta<typeof Modal> = {
    title: 'Components/UI/Modal',
    component: Modal,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Open Modal</Button>
                <Modal open={open} onOpenChange={setOpen} title="Modal Title">
                    <p>This is a simple modal window content.</p>
                </Modal>
            </>
        );
    },
};

export const LargeContent: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Open Scrollable Modal</Button>
                <Modal open={open} onOpenChange={setOpen} title="Scrollable Content">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <p key={i}>
                                This is paragraph {i + 1} of a very long text. Modals should be scrollable when the
                                content exceeds the screen height.
                            </p>
                        ))}
                    </div>
                </Modal>
            </>
        );
    },
};
