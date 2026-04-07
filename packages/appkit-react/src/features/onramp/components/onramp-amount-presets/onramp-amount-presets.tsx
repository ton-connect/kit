/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentProps, FC } from 'react';
import clsx from 'clsx';

import { Button } from '../../../../components/button';
import styles from './onramp-amount-presets.module.css';
import type { OnrampAmountPreset } from '../../types';

export interface OnrampAmountPresetsProps extends ComponentProps<'div'> {
    presets: OnrampAmountPreset[];
    currencySymbol?: string;
    onPresetSelect: (value: string) => void;
}

export const OnrampAmountPresets: FC<OnrampAmountPresetsProps> = ({
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
                    onClick={() => onPresetSelect(preset.amount)}
                >
                    {currencySymbol}
                    {preset.label}
                </Button>
            ))}
        </div>
    );
};
