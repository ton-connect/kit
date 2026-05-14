/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import { CheckIcon, CopyIcon } from '../../ui/icons';
import { useCopy } from '../../../hooks/use-copy';
import styles from './copy-button.module.css';

export interface CopyButtonProps extends Omit<ComponentProps<'button'>, 'value' | 'children' | 'onClick'> {
    /** The text written to the clipboard when the button is clicked. */
    value: string;
    /** Accessible label for screen readers. */
    'aria-label': string;
}

export const CopyButton: FC<CopyButtonProps> = ({ value, className, type = 'button', ...props }) => {
    const [copied, copy] = useCopy(value);

    return (
        <button type={type} className={clsx(styles.button, className)} onClick={copy} {...props}>
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        </button>
    );
};
