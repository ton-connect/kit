/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Modal } from './modal';
import { Button } from '../button';

const meta: Meta<typeof Modal> = {
    title: 'Components/Modal',
    component: Modal,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof Modal>;

const ModalTemplate = ({ title, children }: { title?: string; children?: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
                {children}
            </Modal>
        </>
    );
};

export const Default: Story = {
    render: () => (
        <ModalTemplate title="Modal Title">
            <div style={{ padding: '16px', color: 'white' }}>
                <p>This is the modal content. You can put anything here.</p>
            </div>
        </ModalTemplate>
    ),
};

export const WithLongContent: Story = {
    render: () => (
        <ModalTemplate title="Long Content Modal">
            <div style={{ padding: '16px', color: 'white' }}>
                <p>This modal has a lot of content to demonstrate scrolling behavior.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.</p>
                <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.</p>
            </div>
        </ModalTemplate>
    ),
};

export const NoTitle: Story = {
    render: () => (
        <ModalTemplate>
            <div style={{ padding: '16px', color: 'white' }}>
                <p>This modal has no title.</p>
            </div>
        </ModalTemplate>
    ),
};
