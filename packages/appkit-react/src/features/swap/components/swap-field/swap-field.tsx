/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC, ReactNode } from 'react';

import { Input } from '../../../../components/input/input';
import { TokenSelector } from '../token-selector/token-selector';
import styles from './swap-field.module.css';

export interface SwapFieldProps {
    type: 'pay' | 'receive';
    tokenSymbol: string;
    tokenIcon: ReactNode;
    amount: string;
    onAmountChange: (value: string) => void;
    usdValue?: string;
    balance?: string;
    onMaxClick?: () => void;
}

export const SwapField: FC<SwapFieldProps> = ({
    type,
    tokenSymbol,
    tokenIcon,
    amount,
    onAmountChange,
    usdValue,
    balance,
    onMaxClick,
}) => {
    return (
        <Input.Container size="l" variant="unstyled" className={styles.container}>
            <Input.Header className={styles.header}>
                <Input.Title>{type === 'pay' ? 'Pay' : 'Receive'}</Input.Title>
            </Input.Header>

            <Input.Field>
                <Input.Input placeholder="0" value={amount} onChange={(e) => onAmountChange(e.target.value)} />
                <Input.Slot side="right">
                    <TokenSelector symbol={tokenSymbol} icon={tokenIcon} />
                </Input.Slot>
            </Input.Field>

            <Input.Caption className={styles.caption}>
                <div className={styles.balanceLine}>
                    <span>{usdValue ? `$ ${usdValue}` : '$ 0.00'}</span>
                    {type === 'pay' && balance && (
                        <span>
                            MAX{' '}
                            <button className={styles.maxButton} onClick={onMaxClick} type="button">
                                {balance} {tokenSymbol}
                            </button>
                        </span>
                    )}

                    {type === 'receive' && balance && (
                        <span>
                            {balance} {tokenSymbol}
                        </span>
                    )}
                </div>
            </Input.Caption>
        </Input.Container>
    );
};
