/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLayoutEffect, useRef, useState } from 'react';
import type { FC } from 'react';

import styles from './onramp-amount-input.module.css';

export interface OnrampAmountInputProps {
    value: string;
    onChange: (value: string) => void;
    ticker?: string;
    symbol?: string;
    placeholder?: string;
}

export const OnrampAmountInput: FC<OnrampAmountInputProps> = ({
    value,
    onChange,
    ticker,
    symbol,
    placeholder = '0',
}) => {
    const mirrorRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);

    useLayoutEffect(() => {
        if (mirrorRef.current) {
            setInputWidth(mirrorRef.current.offsetWidth + 2);
        }
    }, [value, placeholder]);

    return (
        <div className={styles.wrapper} onClick={() => inputRef.current?.focus()}>
            <div className={styles.row}>
                {symbol && <span className={styles.symbol}>{symbol}</span>}
                <input
                    ref={inputRef}
                    className={styles.input}
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ width: inputWidth ? `${inputWidth}px` : undefined }}
                />
                {ticker && <span className={styles.ticker}>{ticker}</span>}
            </div>

            <span ref={mirrorRef} className={styles.mirror} aria-hidden="true">
                {value || placeholder}
            </span>
        </div>
    );
};
