/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type JsonSchema = {
    type?: string | string[];
    enum?: unknown[];
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    additionalProperties?: boolean | JsonSchema;
    anyOf?: JsonSchema[];
    oneOf?: JsonSchema[];
};

const NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

function normalizeCliValue(value: unknown, schema?: JsonSchema): unknown {
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
            return normalizeCliValue(JSON.parse(value), schema);
        } catch {
            // ignore parse errors and fallback to original value
        }
    }

    const variants = schema?.oneOf ?? schema?.anyOf;
    if (variants?.length) {
        let fallback: unknown;

        for (const variant of variants) {
            const normalized = normalizeCliValue(value, variant);
            if (variant.enum?.includes(normalized)) return normalized;

            const types = Array.isArray(variant.type) ? variant.type : variant.type ? [variant.type] : [];
            if (typeof normalized === 'string' || typeof normalized === 'boolean') {
                if (types.includes(typeof normalized)) {
                    if (typeof normalized !== 'string') return normalized;
                    fallback ??= normalized;
                }
                continue;
            }
            if (typeof normalized === 'number') {
                if (
                    Number.isFinite(normalized) &&
                    (types.includes('number') || (Number.isInteger(normalized) && types.includes('integer')))
                ) {
                    return normalized;
                }
                continue;
            }
            if (Array.isArray(normalized)) {
                if (types.includes('array')) return normalized;
                continue;
            }
            if (normalized && typeof normalized === 'object' && types.includes('object')) return normalized;
        }

        if (fallback !== undefined) return fallback;
    }

    if (typeof value === 'string') {
        if (!schema) return value;

        const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
        if (types.includes('boolean')) {
            if (value === 'true') return true;
            if (value === 'false') return false;
        }
        if (!NUMBER_PATTERN.test(value) || (!types.includes('integer') && !types.includes('number'))) return value;

        const parsed = Number(value);
        return Number.isFinite(parsed) && (!types.includes('integer') || Number.isInteger(parsed)) ? parsed : value;
    }

    if (Array.isArray(value)) return schema?.items ? value.map((item) => normalizeCliValue(item, schema.items)) : value;
    if (!value || typeof value !== 'object') return value;

    const additionalSchema =
        schema?.additionalProperties && typeof schema.additionalProperties === 'object'
            ? schema.additionalProperties
            : undefined;

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
        result[key] = normalizeCliValue(entry, schema?.properties?.[key] ?? additionalSchema);
    }
    return result;
}

export function parseCliArgs(args: string[], schema?: JsonSchema): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const additionalSchema =
        schema?.additionalProperties && typeof schema.additionalProperties === 'object'
            ? schema.additionalProperties
            : undefined;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg.startsWith('--')) continue;

        const key = arg.slice(2);
        const next = args[i + 1];

        if (!next || next.startsWith('--')) {
            result[key] = true;
            continue;
        }

        i++;
        result[key] = normalizeCliValue(next, schema?.properties?.[key] ?? additionalSchema);
    }

    return result;
}
