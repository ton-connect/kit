/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Parsed CAIP-2 chain identifier — `<namespace>:<reference>`.
 *
 * @see https://chainagnostic.org/CAIPs/caip-2
 */
export interface Caip2 {
    namespace: string;
    reference: string;
}

const CAIP2_REGEX = /^([-a-z0-9]{3,8}):([-_a-zA-Z0-9]{1,32})$/;

/**
 * Parse a CAIP-2 string. Returns `undefined` if the value does not match the
 * `<namespace>:<reference>` shape.
 *
 * @example parseCaip2('eip155:1') // { namespace: 'eip155', reference: '1' }
 */
export const parseCaip2 = (value: string): Caip2 | undefined => {
    const match = CAIP2_REGEX.exec(value);
    if (!match) return undefined;
    return { namespace: match[1]!, reference: match[2]! };
};

/**
 * Build a CAIP-2 string from namespace and reference.
 */
export const formatCaip2 = (namespace: string, reference: string | number): string => {
    return `${namespace}:${reference}`;
};
