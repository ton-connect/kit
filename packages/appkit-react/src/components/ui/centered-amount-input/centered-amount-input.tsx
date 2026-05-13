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

import styles from './centered-amount-input.module.css';

const MIN_FONT_SCALE = 0.5;

/**
 * Props accepted by {@link CenteredAmountInput}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface CenteredAmountInputProps extends ComponentProps<'div'> {
    /** Controlled input value (decimal string). */
    value: string;
    /** Called with the new string whenever the user edits the input. */
    onValueChange: (value: string) => void;
    /** Optional trailing ticker label (e.g., `'TON'`). */
    ticker?: string;
    /** Optional leading currency symbol (e.g., `'$'`). */
    symbol?: string;
    /** Placeholder shown when `value` is empty. Defaults to `'0'`. */
    placeholder?: string;
    /** When true, the underlying `<input>` is disabled. */
    disabled?: boolean;
}

/**
 * Center-aligned, auto-resizing amount input with optional leading symbol and trailing ticker. Scales the font down to fit the container when the rendered text overflows, and clicking the wrapper focuses the input.
 *
 * @sample docs/examples/src/appkit/components/ui#CENTERED_AMOUNT_INPUT
 *
 * @public
 * @category Component
 * @section UI
 */
export const CenteredAmountInput: FC<CenteredAmountInputProps> = ({
    value,
    onValueChange,
    ticker,
    symbol,
    placeholder = '0',
    disabled,
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
                    disabled={disabled}
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
