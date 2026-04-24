/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const truncateAddress = (address: string, startPart = 5, endPart = 5) =>
    address.length <= startPart + endPart ? address : `${address.slice(0, startPart)}…${address.slice(-endPart)}`;
