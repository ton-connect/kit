/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('path');
const https = require('https');

const { generateApi } = require('swagger-typescript-api');

/**
 * Script to download swagger spec and generate TypeScript types
 * 1. Downloads from: https://analytics.ton.org/swagger/doc.json
 * 2. Transforms event_name patterns
 * 3. Generates TypeScript types using swagger-typescript-api
 */

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading from ${url}...`);
        https
            .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
                    return;
                }

                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    console.log('✅ Download completed');
                    resolve(data);
                });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

function removeEmptyStringsFromEnums(parsedContent) {
    // Recursively walk through the object and convert enum arrays to anyOf structure
    function processObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map(processObject);
        } else if (obj !== null && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                if (key === 'enum' && Array.isArray(value) && obj.type === 'string') {
                    // Convert enum to anyOf with const values + string type
                    const nonEmptyValues = value.filter((item) => item !== '');
                    if (nonEmptyValues.length > 0) {
                        // Remove enum and add anyOf
                        delete result.enum;
                        result.anyOf = [...nonEmptyValues.map((val) => ({ const: val })), { type: 'string' }];
                    } else {
                        result[key] = value;
                    }
                } else {
                    result[key] = processObject(value);
                }
            }
            return result;
        }
        return obj;
    }

    return processObject(parsedContent);
}

function transformEventName(content) {
    // Step 1: Replace event_name enum structure with const (when example is present)
    const pattern = /"event_name":\s*\{\s*"type":\s*"string",\s*"enum":\s*\[[^\]]+\],\s*"example":\s*"([^"]+)"\s*\}/g;

    const result = content.replace(pattern, (_match, eventName) => {
        return `"event_name": {
                    "const": "${eventName}",
                    "type": "string",
                    "example": "${eventName}"
                }`;
    });

    // Step 2: Parse and handle enum arrays with empty strings
    const parsedContent = JSON.parse(result);

    if (parsedContent.definitions) {
        for (const [key, definition] of Object.entries(parsedContent.definitions)) {
            if (key.includes('Event') && definition.properties && definition.properties.event_name) {
                const eventNameProp = definition.properties.event_name;

                // Handle enum arrays like ["", "bridge-message-expired"]
                if (eventNameProp.enum && Array.isArray(eventNameProp.enum)) {
                    const nonEmptyValues = eventNameProp.enum.filter((val) => val !== '');

                    // If there's exactly one non-empty value, convert to const
                    if (nonEmptyValues.length === 1) {
                        const eventName = nonEmptyValues[0];
                        definition.properties.event_name = {
                            const: eventName,
                            type: 'string',
                            example: eventName,
                        };
                    }
                }

                // Make event_name required
                if (!definition.required) {
                    definition.required = [];
                }
                if (!definition.required.includes('event_name')) {
                    definition.required.push('event_name');
                }
            }
        }
    }

    return parsedContent;
}

async function main() {
    const swaggerUrl = 'https://analytics.ton.org/swagger/doc.json';
    const swaggerJsonPath = path.join(__dirname, 'swagger.json');
    const outputPath = path.join(__dirname);

    try {
        // 1. Download doc.json
        const content = await downloadFile(swaggerUrl);

        // 2. Transform event_name: replace enum with const and make required
        console.log('Transforming event_name...');
        let parsedContent = transformEventName(content);

        // 3. Remove empty strings from all enum arrays
        console.log('Removing empty strings from enums...');
        parsedContent = removeEmptyStringsFromEnums(parsedContent);

        const newPathKeys = Object.keys(parsedContent.paths).filter((key) => key === '/events');
        const newPaths = {};
        for (const key of newPathKeys) {
            newPaths[key] = parsedContent.paths[key];
        }
        parsedContent.paths = newPaths;

        const definitionKeys = Object.keys(parsedContent.definitions);
        parsedContent.paths['/events'].post.parameters[1] = {
            ...parsedContent.paths['/events'].post.parameters[1],
            schema: {
                ...parsedContent.paths['/events'].post.parameters[1].schema,
                items: {
                    oneOf: definitionKeys
                        .filter((key) => key.includes('Event'))
                        .map((key) => ({
                            $ref: `#/definitions/${key}`,
                        })),
                },
            },
        };

        const originalMatches = content.match(/"event_name":\s*\{\s*"type":\s*"string",\s*"example":\s*"[^"]+"\s*\}/g);
        const originalCount = originalMatches ? originalMatches.length : 0;
        console.log(`🔄 Made ${originalCount} event_name replacements`);

        // Save modified content to doc.json temporarily
        const modifiedContent = JSON.stringify(parsedContent, null, 4);
        fs.writeFileSync(swaggerJsonPath, modifiedContent);
        console.log('💾 Saved doc.json temporarily');

        // 3. Generate Api.ts using swagger-typescript-api from doc.json file
        console.log('Generating TypeScript types...');
        await generateApi({
            output: outputPath,
            input: swaggerJsonPath,
            httpClientType: 'fetch',
            generateClient: true,
            modular: false,
            cleanOutput: false,
        });

        // 4. Rename Api.ts to generated.ts
        const apiTsPath = path.join(outputPath, 'Api.ts');
        const generatedTsPath = path.join(outputPath, 'generated.ts');
        if (fs.existsSync(apiTsPath)) {
            fs.renameSync(apiTsPath, generatedTsPath);
            console.log('✅ Renamed Api.ts to generated.ts');
        }

        // 5. Delete swagger.json
        if (fs.existsSync(swaggerJsonPath)) {
            fs.unlinkSync(swaggerJsonPath);
            console.log('🗑 Removed swagger.json');
        }

        console.log('✅ Successfully completed!');
    } catch (error) {
        console.error('❌ Error processing:', error);
        // Clean up doc.json if it exists
        const docJsonPath = path.join(__dirname, 'doc.json');
        if (fs.existsSync(docJsonPath)) {
            fs.unlinkSync(docJsonPath);
        }
        process.exit(1);
    }
}

if (require.main === module) {
    void main();
}
