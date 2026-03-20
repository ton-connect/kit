/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const LEGACY_AGENTIC_PRIVATE_KEY_FIELD = 'operator_private_key' as const;

export type LegacyPrivateKeyCompatible = { private_key?: string } & Partial<
    Record<typeof LEGACY_AGENTIC_PRIVATE_KEY_FIELD, string>
>;

export function readPrivateKeyField(value: LegacyPrivateKeyCompatible): string | undefined {
    return value.private_key ?? value[LEGACY_AGENTIC_PRIVATE_KEY_FIELD];
}
