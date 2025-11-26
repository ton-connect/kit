/* eslint-disable no-console */
const fs = require('fs');

// Load the conversion library
let convertFn;
try {
    const pkg = require('@openapi-contrib/json-schema-to-openapi-schema');
    // Use synchronous version for simplicity
    convertFn = pkg.convertSync || pkg.convert || pkg.default;
    if (typeof convertFn !== 'function') {
        throw new Error('Could not find conversion function in package');
    }
} catch (e) {
    console.error('❌ Could not load @openapi-contrib/json-schema-to-openapi-schema');
    console.error('Error:', e.message);
    console.error('Please install: npm install -g @openapi-contrib/json-schema-to-openapi-schema');
    process.exit(1);
}

const [schemaFile, outputFile] = process.argv.slice(2);

if (!schemaFile || !outputFile) {
    console.error('Usage: node convert-schema-to-openapi.cjs <schema-file> <output-file>');
    process.exit(1);
}

/**
 * Fix number types to use proper OpenAPI integer types.
 * TypeScript 'number' with format int32/int64 should be 'integer' in OpenAPI.
 */
function fixNumberTypes(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(fixNumberTypes);
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = fixNumberTypes(value);
    }

    // Fix: type: number with format: int32/int64 should be type: integer
    if (result.type === 'number' && (result.format === 'int32' || result.format === 'int64')) {
        result.type = 'integer';
    }

    return result;
}

try {
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    const schema = JSON.parse(schemaContent);

    // Extract definitions/schemas
    let schemas = schema.definitions || schema.$defs || {};

    // Convert each schema to OpenAPI format and fix number types
    const openapiSchemas = {};
    for (const [name, schemaObj] of Object.entries(schemas)) {
        const converted = convertFn(schemaObj);
        openapiSchemas[name] = fixNumberTypes(converted);
    }

    // Create OpenAPI spec
    const openapi = {
        openapi: '3.0.0',
        info: {
            title: 'Generated API from TypeScript',
            version: '1.0.0',
            description: 'Auto-generated OpenAPI specification from TypeScript models',
        },
        paths: {},
        components: {
            schemas: openapiSchemas,
        },
    };

    fs.writeFileSync(outputFile, JSON.stringify(openapi, null, 2));
    console.log('✅ OpenAPI spec created: ' + outputFile);
} catch (error) {
    console.error('❌ Error converting schema:', error.message);
    console.error(error.stack);
    process.exit(1);
}
