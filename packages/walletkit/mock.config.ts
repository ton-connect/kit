/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-undef */
const isJest = typeof jest !== 'undefined';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isVitest = typeof (global as any).vi !== 'undefined';

export const useFakeTimers = isJest
    ? jest.useFakeTimers
    : isVitest
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).vi.useFakeTimers
      : () => {
            throw new Error('No test framework detected');
        };

export const useRealTimers = isJest
    ? jest.useRealTimers
    : isVitest
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).vi.useRealTimers
      : () => {
            throw new Error('No test framework detected');
        };

export const mockFn = isJest
    ? jest.fn
    : isVitest
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).vi.fn
      : () => {
            throw new Error('No test framework detected');
        };

export const clearAllMocks = isJest
    ? jest.clearAllMocks
    : isVitest
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).vi.clearAllMocks
      : () => {
            throw new Error('No test framework detected');
        };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mocked = isJest ? jest.mocked : isVitest ? (global as any).vi.mocked : (fn: any) => fn;

export type MockFunction = ReturnType<typeof mockFn>;
