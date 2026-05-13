/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext, useMemo } from 'react';
import type { FC, ReactNode, ComponentProps, ChangeEvent } from 'react';
import clsx from 'clsx';

import { Skeleton } from '../skeleton';
import { useInputResize } from './use-input-resize';
import type { InputSize } from './use-input-resize';
import styles from './input.module.css';

type InputVariant = 'default' | 'unstyled';

interface InputContextProps {
    size: InputSize;
    variant: InputVariant;
    disabled?: boolean;
    error?: boolean;
    loading?: boolean;
    resizable?: boolean;
}

const InputContext = createContext<InputContextProps | undefined>(undefined);

const useInputContext = () => {
    const context = useContext(InputContext);
    if (!context) {
        throw new Error('Input components must be used within an Input.Container');
    }
    return context;
};

/**
 * Props accepted by {@link Input.Container} (also used by {@link Input} itself).
 *
 * @public
 * @category Type
 * @section UI
 */
export interface InputContainerProps extends ComponentProps<'div'> {
    /** Size token applied to the input control(s) inside: `'s' | 'm' | 'l'`. Defaults to `'m'`. */
    size?: InputSize;
    /** Visual variant: `'default'` paints a filled field. `'unstyled'` drops the chrome. */
    variant?: InputVariant;
    /** When true, descendant input controls are disabled. */
    disabled?: boolean;
    /** When true, the field renders in error styling and {@link Input.Caption} switches to error text. */
    error?: boolean;
    /** When true, {@link Input.Input} renders a skeleton placeholder instead of an `<input>`. */
    loading?: boolean;
    /** When true, {@link Input.Input} scales its font down to fit the available width as the user types. */
    resizable?: boolean;
    /** Compound sub-components (header, field, control, caption). */
    children: ReactNode;
}

const Container: FC<InputContainerProps> = ({
    size = 'm',
    variant = 'default',
    disabled,
    error,
    loading,
    resizable,
    className,
    children,
    ...props
}) => {
    const contextValue = useMemo(
        () => ({ size, variant, disabled, error, loading, resizable }),
        [size, variant, disabled, error, loading, resizable],
    );

    return (
        <InputContext.Provider value={contextValue}>
            <div
                className={clsx(
                    styles.container,
                    styles[`variant-${variant}`],
                    disabled && styles.disabled,
                    error && styles.error,
                    loading && styles.loading,
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        </InputContext.Provider>
    );
};

/**
 * Props accepted by {@link Input.Header}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface InputHeaderProps extends ComponentProps<'div'> {
    /** Header content — typically a {@link Input.Title} and optional trailing controls. */
    children: ReactNode;
}

const Header: FC<InputHeaderProps> = ({ className, children, ...props }) => (
    <div className={clsx(styles.header, className)} {...props}>
        {children}
    </div>
);

const Title: FC<ComponentProps<'span'>> = ({ className, children, ...props }) => (
    <span className={clsx(styles.title, className)} {...props}>
        {children}
    </span>
);

/**
 * Props accepted by {@link Input.Field}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface InputFieldProps extends ComponentProps<'div'> {
    /** Field content — typically slots and the input control laid out horizontally. */
    children: ReactNode;
}

const Field: FC<InputFieldProps> = ({ className, children, ...props }) => (
    <div className={clsx(styles.field, className)} {...props}>
        {children}
    </div>
);

/**
 * Props accepted by {@link Input.Slot}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface InputSlotProps extends ComponentProps<'div'> {
    /** Which edge of the field the slot adheres to. */
    side?: 'left' | 'right';
}

const Slot: FC<InputSlotProps> = ({ side, className, children, ...props }) => (
    <div className={clsx(styles.slot, side === 'right' && styles.right, className)} {...props}>
        {children}
    </div>
);

/**
 * Props accepted by {@link Input.Input} — standard `<input>` props. Size, disabled, loading, and resizable behavior are inherited from the surrounding {@link Input.Container}.
 *
 * @public
 * @category Type
 * @section UI
 */
export type InputControlProps = ComponentProps<'input'>;

const InputControl: FC<InputControlProps> = ({ className, disabled: propsDisabled, onChange, ...props }) => {
    const { size: contextSize, disabled: contextDisabled, loading, resizable } = useInputContext();
    const disabled = propsDisabled || contextDisabled;

    const { inputRef, measureMaxRef, measureMinRef, resizeStyle, adjustSize } = useInputResize({
        resizable,
        contextSize,
        value: props.value,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        adjustSize();
    };

    const text = String(props.value ?? props.defaultValue ?? '');

    if (loading) {
        const skeletonClass = styles[`inputSkeleton_${contextSize}`];

        return (
            <div className={clsx(styles.input, styles.inputSkeleton, skeletonClass, className)}>
                <Skeleton width={75} height="70%" />
            </div>
        );
    }

    return (
        <>
            {resizable && (
                <>
                    {/* Measures actual text width at max (contextSize) font — source of truth for scaling */}
                    <span
                        ref={measureMaxRef}
                        className={clsx(styles.inputMeasure, styles[`input_${contextSize}`])}
                        aria-hidden
                    >
                        {text}
                    </span>
                    {/* Empty span — only used to read minFontSize from CSS variable via computed style */}
                    <span ref={measureMinRef} className={clsx(styles.inputMeasure, styles.input_s)} aria-hidden />
                </>
            )}
            <input
                className={clsx(styles.input, styles[`input_${contextSize}`], className)}
                style={resizeStyle}
                disabled={disabled}
                {...props}
                ref={inputRef}
                onChange={handleChange}
            />
        </>
    );
};

const Caption: FC<ComponentProps<'span'>> = ({ className, children, ...props }) => {
    const { error } = useInputContext();
    return (
        <span className={clsx(styles.caption, error && styles.errorText, className)} {...props}>
            {children}
        </span>
    );
};

/**
 * Compound text-input component. Use the default export as the outer wrapper (it is the {@link Input.Container}) and compose sub-components for the header, field, slots, control, and caption. State flags (`disabled`, `error`, `loading`, `resizable`, `size`) live on the container and are read by the inner control via context.
 *
 * @sample docs/examples/src/appkit/components/ui#INPUT
 *
 * @public
 * @category Component
 * @section UI
 */
export const Input = Object.assign(Container, {
    /** Outer wrapper that provides input context (size, variant, disabled, error, loading, resizable). */
    Container,
    /** Header row above the field — holds the title and optional trailing controls. */
    Header,
    /** Title text shown inside {@link Input.Header}. */
    Title,
    /** Horizontal row that holds slots and the input control. */
    Field,
    /** Side-anchored slot used for adornments such as icons or buttons. */
    Slot,
    /** The actual `<input>` control. Respects context flags and reads its size/variant from {@link Input.Container}. */
    Input: InputControl,
    /** Caption / helper text below the field. Switches to error styling when the container has `error` set. */
    Caption,
});
