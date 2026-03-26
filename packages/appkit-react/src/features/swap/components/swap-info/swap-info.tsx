/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';

import styles from './swap-info.module.css';
import { Block } from '../../../../components/block';

export interface SwapInfoRowProps {
    label: string;
    value: string;
}

export const SwapInfoRow: FC<SwapInfoRowProps> = ({ label, value }) => {
    return (
        <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
        </div>
    );
};

export interface SwapInfoProps {
    rows: Array<{ label: string; value: string }>;
}

export const SwapInfo: FC<SwapInfoProps> = ({ rows }) => {
    return (
        <Block className={styles.infoTable}>
            {rows.map((row, idx) => (
                <SwapInfoRow key={idx} {...row} />
            ))}
        </Block>
    );
};
