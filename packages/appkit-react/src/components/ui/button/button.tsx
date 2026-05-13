/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { forwardRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import clsx from 'clsx';

import styles from './button.module.css';

/**
 * Size token for {@link Button}: `'s' | 'm' | 'l' | 'unset'`. `'unset'` skips the size class entirely.
 *
 * @public
 * @category Type
 * @section UI
 */
export type ButtonSize = 's' | 'm' | 'l' | 'unset';

/**
 * Border-radius token for {@link Button}: `'s' | 'm' | 'l' | 'xl' | '2xl' | 'full'`.
 *
 * @public
 * @category Type
 * @section UI
 */
export type ButtonBorderRadius = 's' | 'm' | 'l' | 'xl' | '2xl' | 'full';

/**
 * Visual variant for {@link Button}: `'fill' | 'secondary' | 'bezeled' | 'gray' | 'ghost' | 'unstyled'`.
 *
 * @public
 * @category Type
 * @section UI
 */
export type ButtonVariant = 'fill' | 'secondary' | 'bezeled' | 'gray' | 'ghost' | 'unstyled';

/**
 * Props accepted by {@link Button}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface ButtonProps extends ComponentProps<'button'> {
    /**
     * Size class applied to the button. Pass `'unset'` to skip the size class
     * entirely (no padding, no typography) — useful with `variant="unstyled"`.
     */
    size?: ButtonSize;
    /** Border radius token. Defaults to a size-dependent value (`s` → `2xl`, `m` → `l`, `l` → `xl`). */
    borderRadius?: ButtonBorderRadius;
    /**
     * Visual variant. Use `'unstyled'` to opt out of all built-in styling —
     * the consumer is fully responsible for visuals via `className`. The
     * Button still provides ref forwarding, `disabled`/`loading` plumbing,
     * and `icon`/`children` rendering.
     */
    variant?: ButtonVariant;
    /** When true, renders a spinner instead of `icon`/`children` and disables the button. */
    loading?: boolean;
    /** When true, the button stretches to fill its container width. */
    fullWidth?: boolean;
    /** Optional leading icon rendered before `children` when not loading. */
    icon?: ReactNode;
}

const SIZE_DEFAULT_RADIUS: Record<Exclude<ButtonSize, 'unset'>, ButtonBorderRadius> = {
    s: '2xl',
    m: 'l',
    l: 'xl',
};

const RADIUS_CLASS: Record<ButtonBorderRadius, string> = {
    s: 'radiusS',
    m: 'radiusM',
    l: 'radiusL',
    xl: 'radiusXl',
    '2xl': 'radius2xl',
    full: 'radiusFull',
};

/**
 * Themed `<button>` with size, border-radius, and variant tokens. Renders an optional leading `icon`, swaps content for a spinner while `loading`, and is disabled whenever `disabled` or `loading` is true.
 *
 * @sample docs/examples/src/appkit/components/ui#BUTTON
 *
 * @public
 * @category Component
 * @section UI
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            size = 'm',
            borderRadius,
            variant = 'fill',
            loading = false,
            fullWidth = false,
            disabled,
            icon,
            children,
            ...props
        },
        ref,
    ) => {
        const radius = borderRadius ?? (size === 'unset' ? undefined : SIZE_DEFAULT_RADIUS[size]);

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    styles.button,
                    size !== 'unset' && styles[size],
                    radius && styles[RADIUS_CLASS[radius]],
                    variant !== 'unstyled' && styles[variant],
                    fullWidth && styles.fullWidth,
                    loading && styles.loading,
                    className,
                )}
                {...props}
            >
                {loading ? (
                    <span className={styles.spinner} />
                ) : (
                    <>
                        {icon && <span className={styles.innerIcon}>{icon}</span>}
                        {children}
                    </>
                )}
            </button>
        );
    },
);

Button.displayName = 'Button';
