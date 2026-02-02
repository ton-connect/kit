/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import axios from 'axios';

type ObjectWithMessage = { message: string } & { [key: string]: unknown };

const isObjectWithMessage = (toBeDetermined: unknown): toBeDetermined is ObjectWithMessage =>
    !!toBeDetermined && !!(toBeDetermined as ObjectWithMessage).message;

export const getErrorMessage = (error: unknown, defaultMessage?: string): string => {
    if (axios.isAxiosError(error)) {
        if (error.response?.data && isObjectWithMessage(error.response.data)) {
            return error.response.data.message;
        }

        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error || isObjectWithMessage(error)) {
        return error.message;
    }

    return defaultMessage || 'Error occurred';
};
