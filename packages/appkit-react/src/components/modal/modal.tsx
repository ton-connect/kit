/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';
import clsx from 'clsx';

import { Dialog } from '../dialog';
import styles from './modal.module.css';

export interface ModalProps {
    /**
     * Controlled open state.
     */
    open?: boolean;
    /**
     * Event handler called when the open state changes.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Modal title.
     */
    title?: string;
    /**
     * Modal content.
     */
    children?: ReactNode;
    /**
     * Additional class name for the content container.
     */
    className?: string;
    /**
     * Additional class name for the body container.
     */
    bodyClassName?: string;
}

const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M1 1L11 11M1 11L11 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const Modal: FC<ModalProps> = ({ open, onOpenChange, title, children, className, bodyClassName }) => {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} onClick={() => onOpenChange?.(false)}>
                    <Dialog.Content className={clsx(styles.content, className)} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            {title && <Dialog.Title className={styles.title}>{title}</Dialog.Title>}
                            <Dialog.Close className={styles.close} aria-label="Close">
                                <CloseIcon />
                            </Dialog.Close>
                        </div>
                        <div className={clsx(styles.body, bodyClassName)}>{children}</div>
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
