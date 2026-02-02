#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Converts JSON Schema to OpenAPI 3.0 specification
 *
 * Usage: node json-schema-to-openapi-spec.js <input-schema.json> <output-openapi.json>
 */

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
    console.error('Usage: node json-schema-to-openapi-spec.js <input-schema.json> <output-openapi.json>');
    process.exit(1);
}

try {
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    const schema = JSON.parse(schemaContent);

    // Extract definitions/schemas
    const schemas = schema.definitions || schema.$defs || {};

    // Convert each schema to OpenAPI format
    const openapiSchemas = {};
    for (const [name, schemaObj] of Object.entries(schemas)) {
        openapiSchemas[name] = convertFn(schemaObj);
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
