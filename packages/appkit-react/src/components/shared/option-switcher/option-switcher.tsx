/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import clsx from 'clsx';

import { ChevronsIcon } from '../../ui/icons';
import { Select } from '../../ui/select';
import styles from './option-switcher.module.css';

/**
 * Single entry rendered as an item inside {@link OptionSwitcher}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface OptionSwitcherOption {
    /** Stable value passed back to {@link OptionSwitcherProps.onChange} when selected. */
    value: string;
    /** Human-readable label shown in the trigger and dropdown item. */
    label: string;
}

/**
 * Props accepted by {@link OptionSwitcher}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface OptionSwitcherProps {
    /** Currently selected option value. */
    value: string | undefined;
    /** Available options. */
    options: OptionSwitcherOption[];
    /** Called when the user picks an option. */
    onChange: (value: string) => void;
    /** When true, the trigger is non-interactive and dimmed. */
    disabled?: boolean;
    /** Extra class applied to the trigger button. */
    className?: string;
}

/**
 * Compact dropdown selector — renders the current option's label and a chevron, opening a {@link Select} popover with the remaining choices. Falls back to the raw `value` or `"—"` when no option matches.
 *
 * @sample docs/examples/src/appkit/components/shared#OPTION_SWITCHER
 *
 * @public
 * @category Component
 * @section Shared
 */
export const OptionSwitcher: FC<OptionSwitcherProps> = ({ value, options, onChange, disabled, className }) => {
    const current = options.find((option) => option.value === value);
    const currentLabel = current?.label ?? value ?? '—';

    return (
        <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
            <Select.Trigger variant="unstyled" size="unset" className={clsx(styles.button, className)}>
                {currentLabel}
                <ChevronsIcon size={20} />
            </Select.Trigger>
            <Select.Content align="end">
                {options.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                        {option.label}
                    </Select.Item>
                ))}
            </Select.Content>
        </Select.Root>
    );
};
