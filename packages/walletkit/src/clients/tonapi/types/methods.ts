/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonApiTvmStackRecord {
    type: 'cell' | 'num' | 'nan' | 'null' | 'tuple' | 'slice';
    cell?: string;
    slice?: string;
    num?: string;
    tuple?: TonApiTvmStackRecord[];
}

export interface TonApiMethodExecutionResult {
    success: boolean;
    exit_code: number;
    stack: TonApiTvmStackRecord[];
    decoded: unknown;
}

export type TonApiExecGetMethodArgType =
    | 'nan'
    | 'null'
    | 'tinyint'
    | 'int257'
    | 'slice'
    | 'cell_boc_base64'
    | 'slice_boc_hex';

export interface TonApiExecGetMethodArg {
    type: TonApiExecGetMethodArgType;
    value: string;
}
