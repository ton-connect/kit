/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useCallback, useContext, useState } from 'react';
import type { ComponentProps, FC, ReactNode } from 'react';
import clsx from 'clsx';

import styles from './tabs.module.css';

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
    value: '',
    onValueChange: () => {},
});

export interface TabsProps extends ComponentProps<'div'> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children: ReactNode;
}

export const Tabs: FC<TabsProps> = ({
    value: controlledValue,
    defaultValue = '',
    onValueChange,
    children,
    className,
    ...props
}) => {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : uncontrolledValue;

    const handleValueChange = useCallback(
        (newValue: string) => {
            if (!isControlled) {
                setUncontrolledValue(newValue);
            }
            onValueChange?.(newValue);
        },
        [isControlled, onValueChange],
    );

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
            <div className={clsx(styles.root, className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export interface TabsListProps extends ComponentProps<'div'> {
    children: ReactNode;
}

export const TabsList: FC<TabsListProps> = ({ children, className, ...props }) => {
    return (
        <div role="tablist" className={clsx(styles.list, className)} {...props}>
            {children}
        </div>
    );
};

export interface TabsTriggerProps extends ComponentProps<'button'> {
    value: string;
    children: ReactNode;
}

export const TabsTrigger: FC<TabsTriggerProps> = ({ value, children, className, ...props }) => {
    const ctx = useContext(TabsContext);
    const isActive = ctx.value === value;

    return (
        <button
            role="tab"
            type="button"
            aria-selected={isActive}
            data-state={isActive ? 'active' : 'inactive'}
            className={clsx(styles.trigger, className)}
            onClick={() => ctx.onValueChange(value)}
            {...props}
        >
            {children}
        </button>
    );
};

export interface TabsContentProps extends ComponentProps<'div'> {
    value: string;
    children: ReactNode;
}

export const TabsContent: FC<TabsContentProps> = ({ value, children, className, ...props }) => {
    const ctx = useContext(TabsContext);
    const isActive = ctx.value === value;

    if (!isActive) return null;

    return (
        <div role="tabpanel" data-state={isActive ? 'active' : 'inactive'} className={className} {...props}>
            {children}
        </div>
    );
};
