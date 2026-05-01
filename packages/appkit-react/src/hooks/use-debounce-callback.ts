/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useMemo, useRef } from 'react';
import { debounce } from '@ton/appkit';
import type { DebounceOptions } from '@ton/appkit';

import { useUnmount } from './use-unmount';

interface ControlFunctions {
    cancel: () => void;
    flush: () => void;
    isPending: () => boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DebouncedState<T extends (...args: any[]) => ReturnType<T>> = ((
    ...args: Parameters<T>
) => ReturnType<T> | void) &
    ControlFunctions;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounceCallback<T extends (...args: any[]) => ReturnType<T>>(
    func: T,
    delay = 500,
    options?: DebounceOptions,
): DebouncedState<T> {
    const debouncedFunc = useRef<ReturnType<typeof debounce> | null>(null);

    useUnmount(() => {
        if (debouncedFunc.current) {
            debouncedFunc.current.cancel();
        }
    });

    const debounced = useMemo(() => {
        const debouncedFuncInstance = debounce(func, delay, options);

        const wrappedFunc: DebouncedState<T> = (...args: Parameters<T>) => {
            return debouncedFuncInstance(...args);
        };

        wrappedFunc.cancel = () => {
            debouncedFuncInstance.cancel();
        };

        wrappedFunc.isPending = () => {
            return !!debouncedFunc.current;
        };

        wrappedFunc.flush = () => {
            return debouncedFuncInstance.flush();
        };

        return wrappedFunc;
    }, [func, delay, options]);

    // Update the debounced function ref whenever func, wait, or options change
    useEffect(() => {
        debouncedFunc.current = debounce(func, delay, options);
    }, [func, delay, options]);

    return debounced;
}
