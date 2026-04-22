/**
 * Integration tests for generate-json-schema.js.
 *
 * Runs the generator once against a fixture file that exercises every distinct
 * TypeScript→JSON Schema pattern, then asserts on the vendor-extension output.
 *
 * Pattern map (one describe block per pattern, no cross-pattern overlap):
 *   1  TypeScript enum              → x-enum-varnames (camelCase member names)
 *   2  Const-object enum            → definition renamed, varnames from prefix strip
 *   3  @format int / frozen         → integer type / x-frozen object
 *   4  @discriminator interface union → x-interface-union + empty/single-field/full variants
 *   5  Inline type-literal union    → x-enum-cases (DiscriminatedUnionNodeParser path)
 *   6  Generic interface            → x-is-generic, x-generic-params, x-generic-type-ref
 *   7  Type alias                   → x-type-alias, x-alias-target
 *   8  Standalone literal property  → x-constant-fields (postProcessConstantFields)
 *   9  @default annotation          → stripped (postProcessStripDefaults)
 *  10  ALLCAPS enum member names    → lowercase varnames
 *  11  Multiple literal properties  → x-constant-fields array length > 1
 *  12  Non-'type' discriminator     → x-discriminator-field not hardcoded
 *  13  Underscore rawValue          → camelCase case name / property key
 *  14  Optional single-field variant → x-single-field-optional
 */

import { execFileSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { beforeAll, describe, expect, it } from 'vitest';

const GENERATOR = join(__dirname, 'generate-json-schema.js');
const FIXTURE = join(__dirname, '__fixtures__/model-patterns.fixture.ts');

type SchemaDef = Record<string, unknown>;

let defs: Record<string, SchemaDef>;

beforeAll(() => {
    const outputPath = join(tmpdir(), `schema-test-${process.pid}.json`);
    execFileSync('node', [GENERATOR, FIXTURE, outputPath], { timeout: 60_000 });
    const raw: { definitions: Record<string, SchemaDef> } = JSON.parse(readFileSync(outputPath, 'utf8'));
    defs = raw.definitions ?? {};
    try {
        unlinkSync(outputPath);
    } catch {
        // ignore cleanup failure
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. TypeScript enum
// ─────────────────────────────────────────────────────────────────────────────

describe('TypeScript enum', () => {
    it('camelCases PascalCase member names into x-enum-varnames', () => {
        // "North" → "north", "SouthWest" → "southWest" (member names, not values)
        expect(defs.Direction?.['x-enum-varnames']).toEqual(['north', 'southWest']);
    });

    it('preserves original enum values in enum array', () => {
        expect(defs.Direction?.enum).toEqual(['north', 'south_west']);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Const-object enum
// ─────────────────────────────────────────────────────────────────────────────

describe('const-object enum', () => {
    it('renames definition from type alias name to the const object name', () => {
        expect(defs.SettlementMethod).toBeDefined();
        expect(defs.SettlementMethodValue).toBeUndefined();
    });

    it('strips SCREAMING_SNAKE prefix and camelCases the remainder into x-enum-varnames', () => {
        // SETTLEMENT_METHOD_ prefix stripped → SWAP → "swap", ESCROW → "escrow"
        expect(defs.SettlementMethod?.['x-enum-varnames']).toEqual(['swap', 'escrow']);
    });

    it('preserves the original SCREAMING_SNAKE_CASE values in enum array', () => {
        expect(defs.SettlementMethod?.enum).toEqual(['SETTLEMENT_METHOD_SWAP', 'SETTLEMENT_METHOD_ESCROW']);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. @format annotations
// ─────────────────────────────────────────────────────────────────────────────

describe('@format int annotation', () => {
    it('converts number property to integer type', () => {
        const props = defs.AnnotatedFields?.properties as Record<string, SchemaDef> | undefined;
        expect(props?.count?.type).toBe('integer');
        expect(props?.count?.format).toBe('int');
    });

    it('does not coerce a plain number property to integer', () => {
        const props = defs.AnnotatedFields?.properties as Record<string, SchemaDef> | undefined;
        expect(props?.ratio?.type).toBe('number');
    });
});

describe('@format frozen annotation', () => {
    it('produces x-frozen object schema with no inner type info', () => {
        const props = defs.AnnotatedFields?.properties as Record<string, SchemaDef> | undefined;
        const extra = props?.extra;
        expect(extra?.['x-frozen']).toBe(true);
        expect(extra?.type).toBe('object');
        // Must NOT carry through the original `unknown` type information
        expect(extra?.anyOf).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. @discriminator interface union
// ─────────────────────────────────────────────────────────────────────────────

describe('@discriminator interface union — parent type', () => {
    it('marks the union as x-discriminated-union and x-interface-union', () => {
        expect(defs.Notification?.['x-discriminated-union']).toBe(true);
        expect(defs.Notification?.['x-interface-union']).toBe(true);
    });

    it('records the discriminator field name', () => {
        expect(defs.Notification?.['x-discriminator-field']).toBe('type');
    });

    it('emits a case property for each union member', () => {
        const props = defs.Notification?.properties as Record<string, SchemaDef> | undefined;
        expect(props).toHaveProperty('x_info');
        expect(props).toHaveProperty('x_alert');
        expect(props).toHaveProperty('x_ping');
    });

    it('collects single-field variant field names into x-single-field-coding-keys', () => {
        expect(defs.Notification?.['x-single-field-coding-keys']).toEqual([{ name: 'level' }]);
    });
});

describe('@discriminator interface union — full variant (2+ remaining fields)', () => {
    it('links to the member type via allOf $ref', () => {
        const props = defs.Notification?.properties as Record<string, SchemaDef> | undefined;
        const xInfo = props?.x_info as SchemaDef | undefined;
        const allOf = xInfo?.allOf as Array<{ $ref?: string }> | undefined;
        expect(allOf?.[0]?.$ref).toBe('#/components/schemas/InfoNotification');
    });

    it('carries enum-case metadata', () => {
        const props = defs.Notification?.properties as Record<string, SchemaDef> | undefined;
        const xInfo = props?.x_info as SchemaDef | undefined;
        expect(xInfo?.['x-enum-case-name']).toBe('info');
        expect(xInfo?.['x-enum-case-raw-value']).toBe('info');
    });

    it('removes the discriminator field from the member type and adds x-constant-fields', () => {
        const memberProps = defs.InfoNotification?.properties as Record<string, SchemaDef> | undefined;
        expect(memberProps).not.toHaveProperty('type');
        expect(defs.InfoNotification?.['x-constant-fields']).toEqual([
            { name: 'type', value: 'info', type: 'String' },
        ]);
    });
});

describe('@discriminator interface union — single-field variant (1 remaining field)', () => {
    it('inlines the field schema onto the case property and sets single-field markers', () => {
        const props = defs.Notification?.properties as Record<string, SchemaDef> | undefined;
        const xAlert = props?.x_alert as SchemaDef | undefined;
        expect(xAlert?.['x-single-field-variant']).toBe(true);
        expect(xAlert?.['x-single-field-name']).toBe('level');
        // The field type (string) replaces the allOf $ref
        expect(xAlert?.type).toBe('string');
        expect(xAlert?.allOf).toBeUndefined();
    });

    it('marks the member model for suppression', () => {
        expect(defs.AlertNotification?.['x-skip-model']).toBe(true);
    });
});

describe('@discriminator interface union — empty variant (0 remaining fields)', () => {
    it('sets x-empty-variant on the case property', () => {
        const props = defs.Notification?.properties as Record<string, SchemaDef> | undefined;
        expect((props?.x_ping as SchemaDef | undefined)?.['x-empty-variant']).toBe(true);
    });

    it('does NOT mark the empty-variant member model for suppression', () => {
        // Only single-field variants get x-skip-model; empty variants keep their model
        expect(defs.PingNotification?.['x-skip-model']).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Inline type-literal union (DiscriminatedUnionNodeParser)
// ─────────────────────────────────────────────────────────────────────────────

describe('inline type-literal union', () => {
    it('marks the union with x-discriminated-union but NOT x-interface-union', () => {
        expect(defs.StackItem?.['x-discriminated-union']).toBe(true);
        expect(defs.StackItem?.['x-interface-union']).toBeUndefined();
    });

    it('emits x-enum-cases with correct hasAssociatedValue flags', () => {
        const cases = defs.StackItem?.['x-enum-cases'] as Array<{
            name: string;
            rawValue: string;
            hasAssociatedValue: boolean;
        }>;
        expect(cases).toHaveLength(3);
        expect(cases.find((c) => c.rawValue === 'int')?.hasAssociatedValue).toBe(true);
        expect(cases.find((c) => c.rawValue === 'str')?.hasAssociatedValue).toBe(true);
        expect(cases.find((c) => c.rawValue === 'empty')?.hasAssociatedValue).toBe(false);
    });

    it('creates synthetic $ref types for cases that have a value property', () => {
        expect(defs.StackItemIntValue).toBeDefined();
        expect(defs.StackItemStrValue).toBeDefined();
    });

    it('does NOT create a synthetic type for the case without a value property', () => {
        expect(defs.StackItemEmptyValue).toBeUndefined();
    });

    it('annotates synthetic value types with enum-case metadata', () => {
        expect(defs.StackItemIntValue?.['x-enum-case-name']).toBe('int');
        expect(defs.StackItemStrValue?.['x-enum-case-name']).toBe('str');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Generic interface
// ─────────────────────────────────────────────────────────────────────────────

describe('generic interface', () => {
    it('marks the definition as x-is-generic', () => {
        expect(defs.Paginated?.['x-is-generic']).toBe(true);
    });

    it('lists type parameters in x-generic-params', () => {
        expect(defs.Paginated?.['x-generic-params']).toEqual([{ name: 'T' }]);
    });

    it('annotates the generic-typed property with x-generic-type-ref', () => {
        const props = defs.Paginated?.properties as Record<string, SchemaDef> | undefined;
        expect(props?.items?.['x-generic-type-ref']).toBe('T');
    });

    it('leaves concrete-typed properties as normal schema', () => {
        const props = defs.Paginated?.properties as Record<string, SchemaDef> | undefined;
        expect(props?.total?.['x-generic-type-ref']).toBeUndefined();
        expect(props?.total?.type).toBe('number');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Type alias
// ─────────────────────────────────────────────────────────────────────────────

describe('type alias', () => {
    it('marks a pure-ref definition as x-type-alias with x-alias-target', () => {
        expect(defs.WalletAlias?.['x-type-alias']).toBe(true);
        expect(defs.WalletAlias?.['x-alias-target']).toBe('AddressRef');
    });

    it('does NOT mark the target type itself as an alias', () => {
        expect(defs.AddressRef?.['x-type-alias']).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Standalone literal property → x-constant-fields
// ─────────────────────────────────────────────────────────────────────────────

describe('standalone literal property (postProcessConstantFields)', () => {
    it('removes the literal property from the properties map', () => {
        const props = defs.Versioned?.properties as Record<string, SchemaDef> | undefined;
        expect(props).not.toHaveProperty('version');
    });

    it('adds the literal to x-constant-fields with its string value', () => {
        expect(defs.Versioned?.['x-constant-fields']).toEqual([
            { name: 'version', value: 'v2', type: 'String' },
        ]);
    });

    it('leaves non-literal properties untouched', () => {
        const props = defs.Versioned?.properties as Record<string, SchemaDef> | undefined;
        expect(props?.payload).toEqual({ type: 'string' });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. @default annotation stripping
// ─────────────────────────────────────────────────────────────────────────────

describe('@default annotation', () => {
    it('strips the default value from the property schema', () => {
        const props = defs.WithDefaults?.properties as Record<string, SchemaDef> | undefined;
        expect(props?.enabled).not.toHaveProperty('default');
    });

    it('preserves the property type after stripping', () => {
        const props = defs.WithDefaults?.properties as Record<string, SchemaDef> | undefined;
        expect(props?.enabled?.type).toBe('boolean');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. ALLCAPS enum member names
// ─────────────────────────────────────────────────────────────────────────────

describe('ALLCAPS enum member names', () => {
    it('lowercases ALLCAPS single-word member names into x-enum-varnames', () => {
        // LOW → "low", HIGH → "high" (different toCamelCase branch than PascalCase)
        expect(defs.Flags?.['x-enum-varnames']).toEqual(['low', 'high']);
    });

    it('preserves original numeric values in enum array', () => {
        expect(defs.Flags?.enum).toEqual([0, 1]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Multiple standalone literal properties
// ─────────────────────────────────────────────────────────────────────────────

describe('multiple standalone literal properties (postProcessConstantFields)', () => {
    it('collects all literal properties into x-constant-fields', () => {
        const fields = defs.Wire?.['x-constant-fields'] as Array<{ name: string; value: string; type: string }> | undefined;
        expect(fields).toHaveLength(2);
        expect(fields).toContainEqual({ name: 'magic', value: '0xff', type: 'String' });
        expect(fields).toContainEqual({ name: 'version', value: '2', type: 'String' });
    });

    it('removes all literal properties from the properties map', () => {
        const props = defs.Wire?.properties as Record<string, SchemaDef> | undefined;
        expect(props).not.toHaveProperty('magic');
        expect(props).not.toHaveProperty('version');
    });

    it('leaves non-literal properties untouched', () => {
        const props = defs.Wire?.properties as Record<string, SchemaDef> | undefined;
        expect(props).toHaveProperty('payload');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. @discriminator with a non-'type' field name
// ─────────────────────────────────────────────────────────────────────────────

describe('@discriminator with non-type discriminator field', () => {
    it('records the actual discriminator field name, not the hardcoded "type"', () => {
        expect(defs.GitEvent?.['x-discriminator-field']).toBe('event');
    });

    it('marks the union as x-interface-union', () => {
        expect(defs.GitEvent?.['x-interface-union']).toBe(true);
    });

    it('emits case properties keyed by the discriminator rawValue', () => {
        const props = defs.GitEvent?.properties as Record<string, SchemaDef> | undefined;
        expect(props).toHaveProperty('x_push');
        expect(props).toHaveProperty('x_tag');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Discriminator rawValue with underscores → camelCase case name
// ─────────────────────────────────────────────────────────────────────────────

describe('discriminator rawValue with underscores → camelCase case name', () => {
    it('converts underscore rawValue to camelCase for x-enum-case-name', () => {
        const props = defs.Theme?.properties as Record<string, SchemaDef> | undefined;
        expect((props?.x_darkMode as SchemaDef | undefined)?.['x-enum-case-name']).toBe('darkMode');
        expect((props?.x_lightMode as SchemaDef | undefined)?.['x-enum-case-name']).toBe('lightMode');
    });

    it('preserves the original underscore value in x-enum-case-raw-value', () => {
        const props = defs.Theme?.properties as Record<string, SchemaDef> | undefined;
        expect((props?.x_darkMode as SchemaDef | undefined)?.['x-enum-case-raw-value']).toBe('dark_mode');
        expect((props?.x_lightMode as SchemaDef | undefined)?.['x-enum-case-raw-value']).toBe('light_mode');
    });
});

// 
// 14. Op─────────────────────────────────────────────────────────────────────────────tional single-field variant
// ─────────────────────────────────────────────────────────────────────────────

describe('@discriminator interface union — optional single-field variant', () => {
    it('sets x-single-field-optional when the single remaining field is optional', () => {
        const props = defs.Command?.properties as Record<string, SchemaDef> | undefined;
        expect((props?.x_start as SchemaDef | undefined)?.['x-single-field-optional']).toBe(true);
    });

    it('does not set x-single-field-optional for the empty variant', () => {
        const props = defs.Command?.properties as Record<string, SchemaDef> | undefined;
        expect((props?.x_stop as SchemaDef | undefined)?.['x-single-field-optional']).toBeUndefined();
    });

    it('still sets x-single-field-variant and x-single-field-name for optional fields', () => {
        const props = defs.Command?.properties as Record<string, SchemaDef> | undefined;
        const xStart = props?.x_start as SchemaDef | undefined;
        expect(xStart?.['x-single-field-variant']).toBe(true);
        expect(xStart?.['x-single-field-name']).toBe('timeout');
    });
});
