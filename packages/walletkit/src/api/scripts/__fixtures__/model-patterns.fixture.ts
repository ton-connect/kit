/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Fixture covering every distinct TypeScript→JSON Schema pattern handled by generate-json-schema.js.
 * Excluded from the normal TS build (*.fixture.ts in tsconfig exclude), but ts-json-schema-generator
 * processes it explicitly via the `path` option.
 */

// ── 1. TypeScript enum → x-enum-varnames (camelCase member names, not values) ──

export enum Direction {
    North = 'north',
    SouthWest = 'south_west', // member name "SouthWest" → varname "southWest"; value stays "south_west"
}

// ── 2. Const-object enum → definition renamed to const name, prefix stripped ──

export const SettlementMethod = {
    SETTLEMENT_METHOD_SWAP: 'SETTLEMENT_METHOD_SWAP',
    SETTLEMENT_METHOD_ESCROW: 'SETTLEMENT_METHOD_ESCROW',
} as const;
export type SettlementMethodValue = (typeof SettlementMethod)[keyof typeof SettlementMethod];

// ── 3. @format annotations: int → integer type; frozen → x-frozen object ──

export interface AnnotatedFields {
    /** @format int */
    count: number;
    /** @format frozen */
    extra: unknown;
    ratio: number; // plain number — must NOT be coerced to integer
}

// ── 4. @discriminator interface union (postProcessDiscriminatedUnions) ──
//
//   InfoNotification  → 2 remaining fields after discriminator removal → full variant
//   AlertNotification → 1 remaining field                             → single-field variant
//   PingNotification  → 0 remaining fields                            → empty variant

/** @discriminator type */
export type Notification = InfoNotification | AlertNotification | PingNotification;
export type InfoNotification = { type: 'info'; title: string; body: string };
export type AlertNotification = { type: 'alert'; level: string };
export type PingNotification = { type: 'ping' };

// ── 5. Inline type-literal union (DiscriminatedUnionNodeParser path, no @discriminator) ──
//
//   Members are inline TypeLiterals, not named type aliases.
//   int/str have a `value` property → hasAssociatedValue: true + synthetic ref types
//   empty has no `value`            → hasAssociatedValue: false

export type StackItem = { type: 'int'; value: number } | { type: 'str'; value: string } | { type: 'empty' };

// ── 6. Generic interface → x-is-generic, x-generic-params, x-generic-type-ref ──

export interface Paginated<T> {
    /** The page items */
    items: T;
    total: number;
}

// ── 7. Type alias → x-type-alias, x-alias-target ──

export type AddressRef = { addr: string };
export type WalletAlias = AddressRef; // pure $ref → becomes x-type-alias

// ── 8. Standalone literal property → x-constant-fields (postProcessConstantFields) ──

export interface Versioned {
    version: 'v2'; // { const: 'v2' } → removed from properties, added to x-constant-fields
    payload: string;
}

// ── 9. @default annotation → stripped by postProcessStripDefaults ──

export interface WithDefaults {
    /** @default true */
    enabled: boolean;
    count: number;
}

// ── 10. ALLCAPS enum member names → lowercase varnames (different toCamelCase branch) ──

export enum Flags {
    LOW = 0,
    HIGH = 1,
}

// ── 11. Multiple standalone literal properties → x-constant-fields array length > 1 ──

export interface Wire {
    magic: '0xff';
    version: '2';
    payload: string;
}

// ── 12. @discriminator with a non-'type' field name ──
//
//   Confirms x-discriminator-field is not hardcoded to 'type'.
//   PushEvent has 2 non-discriminator fields → full variant.
//   TagEvent has 1 non-discriminator field  → single-field variant.

/** @discriminator event */
export type GitEvent = PushEvent | TagEvent;
export type PushEvent = { event: 'push'; ref: string; branch: string };
export type TagEvent = { event: 'tag'; ref: string };

// ── 13. Discriminator rawValue with underscore → camelCase case name ──
//
//   toCamelCase('dark_mode') = 'darkMode' in buildInterfaceUnionSchema.
//   Both variants have 2 non-discriminator fields so no single-field inlining noise.

/** @discriminator type */
export type Theme = ThemeDark | ThemeLight;
export type ThemeDark = { type: 'dark_mode'; hex: string; opacity: number };
export type ThemeLight = { type: 'light_mode'; hex: string; opacity: number };

// ── 14. Optional single-field variant → x-single-field-optional ──
//
//   timeout is optional (?) → x-single-field-optional: true.
//   StopCommand has 0 remaining fields → empty variant (control case).

/** @discriminator type */
export type Command = StartCommand | StopCommand;
export type StartCommand = { type: 'start'; timeout?: number };
export type StopCommand = { type: 'stop' };

// ── 15. @format int32 / uint32 → integer type with the specific width format preserved ──
//
//   `number` + `@format int32` must coerce to { type: 'integer', format: 'int32' }. Same for the
//   unsigned variant. These are distinct from the bare `@format int` case already covered above
//   and prove the full INTEGER_FORMATS list is honoured.

export interface WidthFormats {
    /** @format int32 */
    seqno: number;
    /** @format uint32 */
    timestampSec: number;
}

// ── 16. @format int64 → integer type with 64-bit format (the "bigint-like" lane) ──
//
//   JS/TS only reliably represents integers up to 2^53, so the wire format expects a number
//   carrying up to 64 bits. `@format int64` keeps `type: 'integer'` with format preserved so
//   downstream Swift/Kotlin templates can map it to Int64/Long instead of a smaller width.

export interface Int64Fields {
    /** @format int64 */
    bigAmount: number;
    /** @format uint64 */
    unsignedBigAmount: number;
}

// ── 17. @format url → string type, format preserved, NO integer coercion ──
//
//   Covers the format-passthrough path: a non-integer @format tag must leave `type: 'string'`
//   intact and just attach `format: 'url'`. Matches real usage on `DAppInfo.iconUrl`, etc.

export interface WithUrl {
    /** @format url */
    iconUrl: string;
    label: string; // plain string, must NOT gain a format
}

// ── 18. String-literal + ref union → x-string-literal-union (postProcessStringLiteralUnions, PR #361) ──
//
//   `type Endpoint = 'local' | 'remote_peer' | HostAlias` where `HostAlias = string`.
//   ts-json-schema-generator hoists each literal to a synthetic single-value enum definition
//   and emits the parent as an `anyOf` of `$ref`s. The post-processor must:
//     • rewrite the parent to { type: 'object', x-string-literal-union: true, ... }
//     • camelCase each literal rawValue into `x-literal-cases` (`'remote_peer'` → `'remotePeer'`)
//     • pull the single $ref → string-alias target into `x-ref-case`
//     • delete the synthetic single-value-literal definitions it hoisted.

export type HostAlias = string;
export type Endpoint = 'local' | 'remote_peer' | HostAlias;
