/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const passThrough = (value: unknown) => value;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
