/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import { Button } from '../../../../components/button';
import styles from './onramp-amount-presets.module.css';

export interface OnrampAmountPresetsProps {
    presets: number[];
    currencySymbol: string;
    onSelect: (value: number) => void;
}

export const OnrampAmountPresets: FC<OnrampAmountPresetsProps> = ({ presets, currencySymbol, onSelect }) => {
    return (
        <div className={styles.container}>
            {presets.map((value) => (
                <Button
                    key={value}
                    size="s"
                    variant="secondary"
                    className={styles.preset}
                    onClick={() => onSelect(value)}
                >
                    {currencySymbol}
                    {value}
                </Button>
            ))}
        </div>
    );
};
