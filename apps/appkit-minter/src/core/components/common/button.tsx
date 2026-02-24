/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';

import { cn } from '@/core/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    disabled,
    className = '',
    ...props
}) => {
    const baseClasses =
        'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

    const variantClasses = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring shadow-md hover:shadow-lg',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-ring',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
        ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-ring',
    };

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Loading...
                </>
            ) : (
                children
            )}
        </button>
    );
};
