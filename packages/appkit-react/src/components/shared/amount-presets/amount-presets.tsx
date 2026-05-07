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

export interface AmountPreset {
    label: string;
    amount: string;
    onSelect?: () => void;
}

export interface AmountPresetsProps extends ComponentProps<'div'> {
    presets: AmountPreset[];
    currencySymbol?: string;
    onPresetSelect: (value: string) => void;
}

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
