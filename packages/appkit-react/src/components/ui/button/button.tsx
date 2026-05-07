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

export type ButtonSize = 's' | 'm' | 'l';
export type ButtonBorderRadius = 's' | 'm' | 'l' | 'xl' | '2xl' | 'full';

export interface ButtonProps extends ComponentProps<'button'> {
    size?: ButtonSize;
    borderRadius?: ButtonBorderRadius;
    variant?: 'fill' | 'secondary' | 'bezeled' | 'gray' | 'ghost';
    loading?: boolean;
    fullWidth?: boolean;
    icon?: ReactNode;
}

const SIZE_DEFAULT_RADIUS: Record<ButtonSize, ButtonBorderRadius> = {
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
        const radius = borderRadius ?? SIZE_DEFAULT_RADIUS[size];

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    styles.button,
                    styles[size],
                    styles[RADIUS_CLASS[radius]],
                    styles[variant],
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
