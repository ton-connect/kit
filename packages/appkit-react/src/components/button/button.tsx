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

export interface ButtonProps extends ComponentProps<'button'> {
    size?: 's' | 'm' | 'l';
    variant?: 'fill' | 'secondary' | 'bezeled' | 'gray' | 'ghost';
    loading?: boolean;
    fullWidth?: boolean;
    icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            size = 'l',
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
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    styles.button,
                    styles[size],
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
                        {icon && <span className={styles.icon}>{icon}</span>}
                        {children}
                    </>
                )}
            </button>
        );
    },
);

Button.displayName = 'Button';
