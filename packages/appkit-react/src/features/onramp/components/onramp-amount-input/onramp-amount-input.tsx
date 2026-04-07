/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { FC, ComponentProps } from 'react';
import clsx from 'clsx';

import styles from './onramp-amount-input.module.css';

const MIN_FONT_SCALE = 0.5;

export interface OnrampAmountInputProps extends ComponentProps<'div'> {
    value: string;
    onValueChange: (value: string) => void;
    ticker?: string;
    symbol?: string;
    placeholder?: string;
}

export const OnrampAmountInput: FC<OnrampAmountInputProps> = ({
    value,
    onValueChange,
    ticker,
    symbol,
    placeholder = '0',
    className,
    ...props
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const measureRowRef = useRef<HTMLDivElement>(null);
    const mirrorRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);
    const [fontScale, setFontScale] = useState(1);

    const adjustSize = useCallback(() => {
        const wrapper = wrapperRef.current;
        const measureRow = measureRowRef.current;
        const mirror = mirrorRef.current;

        if (!wrapper || !measureRow || !mirror) return;

        const contentWidth = measureRow.offsetWidth;
        const availableWidth = wrapper.clientWidth - 4;

        let scale = 1;
        if (contentWidth > 0 && contentWidth > availableWidth) {
            scale = Math.max(MIN_FONT_SCALE, availableWidth / contentWidth);
        }

        setFontScale(scale);
        setInputWidth(mirror.offsetWidth * scale + 4);
    }, []);

    useLayoutEffect(adjustSize, [value, placeholder, symbol, ticker, adjustSize]);

    useLayoutEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const observer = new ResizeObserver(adjustSize);
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [adjustSize]);

    const scaledInputFontSize = fontScale < 1 ? `calc(var(--ta-input-xl-size) * ${fontScale})` : undefined;
    const scaledTickerFontSize = fontScale < 1 ? `calc(var(--ta-input-xl-symbol-size) * ${fontScale})` : undefined;

    return (
        <div
            ref={wrapperRef}
            className={clsx(styles.wrapper, className)}
            onClick={() => inputRef.current?.focus()}
            {...props}
        >
            <div ref={measureRowRef} className={styles.measureRow} aria-hidden="true">
                {symbol && <span className={styles.symbol}>{symbol}</span>}
                <span className={styles.measureText}>{value || placeholder}</span>
                {ticker && <span className={styles.ticker}>{ticker}</span>}
            </div>

            <div className={styles.row}>
                {symbol && (
                    <span className={styles.symbol} style={{ fontSize: scaledInputFontSize }}>
                        {symbol}
                    </span>
                )}
                <input
                    ref={inputRef}
                    className={styles.input}
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    style={{
                        width: inputWidth ? `${inputWidth}px` : undefined,
                        fontSize: scaledInputFontSize,
                    }}
                />
                {ticker && (
                    <span className={styles.ticker} style={{ fontSize: scaledTickerFontSize }}>
                        {ticker}
                    </span>
                )}
            </div>

            <span ref={mirrorRef} className={styles.mirror} aria-hidden="true">
                {value || placeholder}
            </span>
        </div>
    );
};
