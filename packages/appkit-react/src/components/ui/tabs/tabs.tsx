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

/**
 * Props accepted by {@link Tabs}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface TabsProps extends ComponentProps<'div'> {
    /** Controlled active tab value. */
    value?: string;
    /** Initial active tab when uncontrolled. Defaults to `''`. */
    defaultValue?: string;
    /** Called whenever the active tab changes. */
    onValueChange?: (value: string) => void;
    /** Compound sub-components — typically {@link TabsList} (with {@link TabsTrigger}s) followed by {@link TabsContent}s. */
    children: ReactNode;
}

/**
 * Root tabs container — owns the active value (controlled or uncontrolled) and shares it with descendant {@link TabsList}, {@link TabsTrigger}, and {@link TabsContent} via context.
 *
 * @sample docs/examples/src/appkit/components/ui#TABS
 *
 * @public
 * @category Component
 * @section UI
 */
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

/**
 * Props accepted by {@link TabsList}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface TabsListProps extends ComponentProps<'div'> {
    /** Tab triggers — typically one or more {@link TabsTrigger}s. */
    children: ReactNode;
}

/**
 * Horizontal list of tab triggers with `role="tablist"`.
 *
 * @public
 * @category Component
 * @section UI
 */
export const TabsList: FC<TabsListProps> = ({ children, className, ...props }) => {
    return (
        <div role="tablist" className={clsx(styles.list, className)} {...props}>
            {children}
        </div>
    );
};

/**
 * Props accepted by {@link TabsTrigger}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface TabsTriggerProps extends ComponentProps<'button'> {
    /** Value committed to the parent {@link Tabs} when this trigger is activated. */
    value: string;
    /** Trigger label / content. */
    children: ReactNode;
}

/**
 * Tab trigger button with `role="tab"`. Activates its `value` on click and reflects active state via `aria-selected` and `data-state`.
 *
 * @public
 * @category Component
 * @section UI
 */
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

/**
 * Props accepted by {@link TabsContent}.
 *
 * @public
 * @category Type
 * @section UI
 */
export interface TabsContentProps extends ComponentProps<'div'> {
    /** Value this panel is associated with — rendered only when the parent {@link Tabs} is on this value. */
    value: string;
    /** Panel content. */
    children: ReactNode;
}

/**
 * Tab panel rendered with `role="tabpanel"`. Returns `null` unless its `value` matches the active {@link Tabs} value.
 *
 * @public
 * @category Component
 * @section UI
 */
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
