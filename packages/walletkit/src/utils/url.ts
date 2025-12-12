/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Validates that a host is a proper domain format.
 * - Must have at least one dot (e.g., "example.com")
 * - Must not start or end with dot (e.g., ".com", "example.")
 * - Must have content between dots (e.g., no "a..b")
 *
 * @param host - The host string to validate (e.g., "example.com", "sub.example.com")
 * @returns true if the host is valid, false otherwise
 */
export function isValidHost(host: string): boolean {
    if (host.indexOf('.') === -1) return false;
    if (host.startsWith('.') || host.endsWith('.')) return false;
    const parts = host.split('.');
    return parts.every((part) => part.length > 0);
}
