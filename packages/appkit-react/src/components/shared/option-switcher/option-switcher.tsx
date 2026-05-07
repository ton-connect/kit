/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import { ChevronsIcon } from '../../ui/icons';
import styles from './option-switcher.module.css';

export interface OptionSwitcherProps extends Omit<ComponentProps<'button'>, 'children'> {
    /** Current value shown in the button. */
    value: string;
    /**
     * When true, there is nothing to switch to: the chevron icon is hidden
     * and the click is a no-op, but the value keeps the active text color.
     */
    singleOption?: boolean;
}

/**
 * Button that cycles through preset values on click.
 * Used inside settings modals next to a label.
 */
export const OptionSwitcher: FC<OptionSwitcherProps> = ({ value, className, disabled, singleOption, ...props }) => {
    return (
        <button
            type="button"
            className={clsx(styles.button, singleOption && styles.singleOption, className)}
            disabled={disabled || singleOption}
            {...props}
        >
            {value}
            {!singleOption && <ChevronsIcon size={20} />}
        </button>
    );
};
