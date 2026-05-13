/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import { Button } from '../../ui/button';
import styles from './amount-presets.module.css';

/**
 * Single preset entry rendered as a button in {@link AmountPresets}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface AmountPreset {
    /** Text shown inside the button (e.g., `"25%"`, `"Max"`, `"100"`). */
    label: string;
    /** Value passed to {@link AmountPresetsProps.onPresetSelect} when the button is clicked. */
    amount: string;
    /** Optional custom click handler — when set, it runs instead of `onPresetSelect`. */
    onSelect?: () => void;
}

/**
 * Props accepted by {@link AmountPresets}.
 *
 * @public
 * @category Type
 * @section Shared
 */
export interface AmountPresetsProps extends ComponentProps<'div'> {
    /** Preset buttons to render, in order. */
    presets: AmountPreset[];
    /** Optional symbol (e.g., `"$"`) prepended to each preset label. */
    currencySymbol?: string;
    /** Called with the selected preset's `amount` unless the preset defines its own `onSelect`. */
    onPresetSelect: (value: string) => void;
}

/**
 * Horizontal row of preset amount buttons — typically used next to an amount input to offer quick fills.
 *
 * @sample docs/examples/src/appkit/components/shared#AMOUNT_PRESETS
 *
 * @public
 * @category Component
 * @section Shared
 */
export const AmountPresets: FC<AmountPresetsProps> = ({
    presets,
    currencySymbol,
    onPresetSelect,
    className,
    ...props
}) => {
    return (
        <div className={clsx(styles.container, className)} {...props}>
            {presets.map((preset) => (
                <Button
                    key={preset.label}
                    size="s"
                    variant="secondary"
                    className={styles.preset}
                    onClick={() => (preset.onSelect ? preset.onSelect() : onPresetSelect(preset.amount))}
                >
                    {currencySymbol}
                    {preset.label}
                </Button>
            ))}
        </div>
    );
};
