/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type RawStackItem =
    | { type: 'null' }
    | { type: 'num'; value: string }
    | { type: 'cell'; value: string }
    | { type: 'slice'; value: string }
    | { type: 'builder'; value: string }
    | { type: 'tuple'; value: RawStackItem[] }
    | { type: 'list'; value: RawStackItem[] };
