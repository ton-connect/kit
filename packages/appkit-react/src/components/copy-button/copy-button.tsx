/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import { useCopy } from '../../hooks/use-copy';
import styles from './copy-button.module.css';

export interface CopyButtonProps extends Omit<ComponentProps<'button'>, 'value' | 'children' | 'onClick'> {
    /** The text written to the clipboard when the button is clicked. */
    value: string;
    /** Accessible label for screen readers. */
    'aria-label': string;
}

const CopyIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path
            d="M3.5 10.5H3a1.5 1.5 0 0 1-1.5-1.5V3A1.5 1.5 0 0 1 3 1.5h6A1.5 1.5 0 0 1 10.5 3v.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
        />
    </svg>
);

const CheckIcon: FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M3 8l3.5 3.5L13 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const CopyButton: FC<CopyButtonProps> = ({ value, className, type = 'button', ...props }) => {
    const [copied, copy] = useCopy(value);

    return (
        <button type={type} className={clsx(styles.button, className)} onClick={copy} {...props}>
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
    );
};
