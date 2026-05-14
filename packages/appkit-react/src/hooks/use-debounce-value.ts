/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useRef, useState } from 'react';
import type { DebounceOptions } from '@ton/appkit';

import type { DebouncedState } from './use-debounce-callback';
import { useDebounceCallback } from './use-debounce-callback';

interface UseDebounceValueOptions<T> extends DebounceOptions {
    equalityFn?: (left: T, right: T) => boolean;
}

export const useDebounceValue = <T>(
    initialValue: T | (() => T),
    delay: number,
    options?: UseDebounceValueOptions<T>,
): [T, DebouncedState<(value: T) => void>] => {
    const eq = options?.equalityFn ?? ((left: T, right: T) => left === right);
    const unwrappedInitialValue = initialValue instanceof Function ? initialValue() : initialValue;
    const [debouncedValue, setDebouncedValue] = useState<T>(unwrappedInitialValue);
    const previousValueRef = useRef<T | undefined>(unwrappedInitialValue);

    const updateDebouncedValue = useDebounceCallback(setDebouncedValue, delay, options);

    // Update the debounced value if the initial value changes
    if (!eq(previousValueRef.current as T, unwrappedInitialValue)) {
        updateDebouncedValue(unwrappedInitialValue);
        previousValueRef.current = unwrappedInitialValue;
    }

    return [debouncedValue, updateDebouncedValue];
};
