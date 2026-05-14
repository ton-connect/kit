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

export interface OptionSwitcherOption {
    value: string;
    label: string;
}

export interface OptionSwitcherProps {
    /** Currently selected option value. */
    value: string | undefined;
    /** Available options. */
    options: OptionSwitcherOption[];
    /** Called when the user picks an option. */
    onChange: (value: string) => void;
    /** When true, the trigger is non-interactive and dimmed. */
    disabled?: boolean;
    className?: string;
}

/**
 * Compact selector used inside settings modals next to a label.
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
