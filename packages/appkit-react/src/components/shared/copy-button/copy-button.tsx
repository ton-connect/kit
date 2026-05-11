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

/**
 * Props accepted by {@link CopyButton}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface CopyButtonProps extends Omit<ComponentProps<'button'>, 'value' | 'children' | 'onClick'> {
    /** Text written to the clipboard when the button is clicked. */
    value: string;
    /** Accessible label for screen readers. */
    'aria-label': string;
}

/**
 * Icon-only button that copies `value` to the clipboard on click and flips its icon to a checkmark for a short confirmation window.
 *
 * @public
 * @category Component
 * @section Shared
 */
export const CopyButton: FC<CopyButtonProps> = ({ value, className, type = 'button', ...props }) => {
    const [copied, copy] = useCopy(value);

    return (
        <button type={type} className={clsx(styles.button, className)} onClick={copy} {...props}>
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        </button>
    );
};
