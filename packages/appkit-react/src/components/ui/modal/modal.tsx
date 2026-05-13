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
import { CloseIcon } from '../icons';
import styles from './modal.module.css';

/**
 * Props accepted by {@link Modal}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface ModalProps {
    /** Controlled open state. */
    open?: boolean;
    /** Called whenever the open state changes (e.g., via the close button, overlay click, or `Escape`). */
    onOpenChange?: (open: boolean) => void;
    /** Optional title rendered in the modal header. */
    title?: string;
    /** Modal body content. */
    children?: ReactNode;
    /** Additional class name applied to the content container. */
    className?: string;
    /** Additional class name applied to the body container. */
    bodyClassName?: string;
}

/**
 * Centered modal dialog with a header (optional title + close button) and a scrollable body. Clicking the overlay closes the modal; clicks on the content do not bubble through.
 *
 * @sample docs/examples/src/appkit/components/ui#MODAL
 *
 * @public
 * @category Component
 * @section UI
 */
export const Modal: FC<ModalProps> = ({ open, onOpenChange, title, children, className, bodyClassName }) => {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} onClick={() => onOpenChange?.(false)}>
                    <Dialog.Content className={clsx(styles.content, className)} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            {title && <Dialog.Title className={styles.title}>{title}</Dialog.Title>}
                            <Dialog.Close className={styles.close} aria-label="Close">
                                <CloseIcon size={12} />
                            </Dialog.Close>
                        </div>
                        <div className={clsx(styles.body, bodyClassName)}>{children}</div>
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
