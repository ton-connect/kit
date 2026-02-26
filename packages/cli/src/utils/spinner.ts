/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import ora from 'ora';
import type { Ora } from 'ora';

export function createSpinner(text: string): Ora {
    return ora({
        text,
        stream: process.stderr,
        discardStdin: false,
    });
}

export async function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
    const spinner = createSpinner(text);
    spinner.start();
    try {
        const result = await fn();
        spinner.stop();
        return result;
    } catch (error) {
        spinner.stop();
        throw error;
    }
}
