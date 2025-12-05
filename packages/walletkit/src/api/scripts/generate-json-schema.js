#!/usr/bin/env node
/**
 * Custom JSON Schema generator that preserves enum member names.
 * Uses ts-json-schema-generator with custom EnumType and formatter.
 */

const fs = require('fs');
const path = require('path');

const tsj = require('ts-json-schema-generator');
const ts = require('typescript');

// ============================================================================
// Constants
// ============================================================================

const INTEGER_FORMATS = ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64'];

// ============================================================================
// Custom EnumType with Member Names
// ============================================================================

/**
 * Extended EnumType that stores member names alongside values.
 */
class EnumTypeWithNames extends tsj.EnumType {
    constructor(id, values, memberNames, annotations = {}) {
        super(id, values);
        this.memberNames = memberNames;
        this.annotations = annotations;
    }

    getMemberNames() {
        return this.memberNames;
    }

    getAnnotations() {
        return this.annotations;
    }
}

// ============================================================================
// Custom EnumNodeParser
// ============================================================================

/**
 * Custom parser that extracts enum member names and JSDoc annotations.
 * Wraps enums in DefinitionType so they become separate schema definitions.
 */
class EnumNodeParserWithNames {
    constructor(typeChecker) {
        this.typeChecker = typeChecker;
    }

    supportsNode(node) {
        return node.kind === ts.SyntaxKind.EnumDeclaration;
    }

    createType(node, context) {
        const members = [...node.members];

        const values = [];
        const memberNames = [];

        // Extract JSDoc annotations from the enum declaration
        const annotations = this.extractAnnotations(node);

        members.forEach((member, index) => {
            // Skip hidden members
            const jsDoc = ts.getJSDocTags(member);
            const isHidden = jsDoc.some((tag) => tag.tagName.text === 'hidden' || tag.tagName.text === 'ignore');
            if (isHidden) return;

            // Get member name
            const name = member.name.getText();
            memberNames.push(name);

            // Get member value
            const constantValue = this.typeChecker.getConstantValue(member);
            if (constantValue !== undefined) {
                values.push(constantValue);
            } else if (member.initializer) {
                values.push(this.parseInitializer(member.initializer));
            } else {
                values.push(index);
            }
        });

        // Create unique ID for this enum
        const sourceFile = node.getSourceFile();
        const id = `enum-${sourceFile.fileName}-${node.pos}`;

        const enumType = new EnumTypeWithNames(id, values, memberNames, annotations);

        // Get the enum name for the definition
        const enumName = node.name.getText();

        // Wrap in DefinitionType so it becomes a separate schema definition
        return new tsj.DefinitionType(enumName, enumType);
    }

    /**
     * Extract JSDoc annotations from a node.
     * Passes through all JSDoc tags as schema properties.
     */
    extractAnnotations(node) {
        const annotations = {};
        const jsDocTags = ts.getJSDocTags(node);

        for (const tag of jsDocTags) {
            const tagName = tag.tagName.text;

            // Skip internal tags
            if (['hidden', 'ignore', 'internal', 'private'].includes(tagName)) {
                continue;
            }

            // Extract tag value
            let tagValue;
            if (tag.comment) {
                tagValue =
                    typeof tag.comment === 'string'
                        ? tag.comment.trim()
                        : tag.comment
                              .map((c) => c.text)
                              .join('')
                              .trim();
            } else {
                tagValue = true; // Boolean flag (e.g., @deprecated)
            }

            // Handle array-type annotations (multiple @example tags)
            if (tagName === 'example') {
                annotations.examples = annotations.examples || [];
                annotations.examples.push(tagValue);
            } else {
                annotations[tagName] = tagValue;
            }
        }

        // Get main JSDoc comment as description if not already set
        if (!annotations.description) {
            const jsDocComments = ts.getJSDocCommentsAndTags(node);
            const mainComment = jsDocComments.find((c) => ts.isJSDoc(c));
            if (mainComment && mainComment.comment) {
                annotations.description =
                    typeof mainComment.comment === 'string'
                        ? mainComment.comment.trim()
                        : mainComment.comment
                              .map((c) => c.text)
                              .join('')
                              .trim();
            }
        }

        return annotations;
    }

    parseInitializer(initializer) {
        switch (initializer.kind) {
            case ts.SyntaxKind.TrueKeyword:
                return true;
            case ts.SyntaxKind.FalseKeyword:
                return false;
            case ts.SyntaxKind.NullKeyword:
                return null;
            case ts.SyntaxKind.StringLiteral:
                return initializer.text;
            case ts.SyntaxKind.NumericLiteral:
                return Number(initializer.text);
            case ts.SyntaxKind.PrefixUnaryExpression:
                if (initializer.operator === ts.SyntaxKind.MinusToken) {
                    return -this.parseInitializer(initializer.operand);
                }
                return initializer.getText();
            case ts.SyntaxKind.ParenthesizedExpression:
                return this.parseInitializer(initializer.expression);
            default:
                return initializer.getText();
        }
    }
}

// ============================================================================
// Custom EnumTypeFormatter with x-enum-varnames
// ============================================================================

/**
 * Custom formatter that adds x-enum-varnames and JSDoc annotations to enum schemas.
 */
class EnumTypeFormatterWithVarnames {
    supportsType(type) {
        return type instanceof tsj.EnumType;
    }

    getDefinition(type) {
        const values = [...new Set(type.getValues())];
        const types = [...new Set(values.map((v) => this.getTypeName(v)))];

        const definition =
            values.length === 1
                ? { type: types[0], const: values[0] }
                : { type: types.length === 1 ? types[0] : types, enum: values };

        // Add x-enum-varnames if we have member names
        if (type instanceof EnumTypeWithNames) {
            const memberNames = type.getMemberNames();
            if (memberNames && memberNames.length === values.length) {
                definition['x-enum-varnames'] = memberNames.map((name) => this.toCamelCase(name));
            }

            // Add JSDoc annotations (format, description, etc.)
            const annotations = type.getAnnotations();
            if (annotations) {
                for (const [key, value] of Object.entries(annotations)) {
                    if (value !== undefined && value !== null) {
                        definition[key] = value;
                    }
                }
            }

            // Fix integer type based on format annotation
            if (definition.type === 'number' && definition.format && INTEGER_FORMATS.includes(definition.format)) {
                definition.type = 'integer';
            }
        }

        return definition;
    }

    getChildren() {
        return [];
    }

    getTypeName(value) {
        if (value === null) return 'null';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'string';
    }

    toCamelCase(str) {
        // Convert SCREAMING_SNAKE_CASE to camelCase
        if (str.includes('_')) {
            return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        }
        // Convert ALLCAPS to lowercase
        if (str === str.toUpperCase()) {
            return str.toLowerCase();
        }
        // Convert PascalCase to camelCase
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
}

// ============================================================================
// Custom AnnotatedTypeFormatter with Integer Type Support
// ============================================================================

/**
 * Extends AnnotatedTypeFormatter to fix integer types after annotations are merged.
 * Converts { type: "number", format: "int32" } → { type: "integer", format: "int32" }
 */
class AnnotatedTypeFormatterWithIntegers extends tsj.AnnotatedTypeFormatter {
    getDefinition(type) {
        const def = super.getDefinition(type);

        // Fix number type with integer format
        if (def.type === 'number' && def.format && INTEGER_FORMATS.includes(def.format)) {
            def.type = 'integer';
        }

        return def;
    }
}

// ============================================================================
// Main
// ============================================================================

const args = process.argv.slice(2);
const inputPath = args[0];
const outputPath = args[1];

if (!inputPath || !outputPath) {
    console.error('Usage: node generate-json-schema.js <input-path> <output-path>');
    process.exit(1);
}

const config = {
    path: inputPath,
    tsconfig: path.resolve(__dirname, '../../../tsconfig.json'),
    type: '*',
    expose: 'all',
    jsDoc: 'extended',
    skipTypeCheck: true,
};

try {
    console.error('📝 Generating JSON Schema with custom formatters...');

    // Create program and parser with our custom enum parser
    const program = tsj.createProgram(config);
    const parser = tsj.createParser(program, config, (prs) => {
        // Add our custom enum parser (it will be checked first)
        prs.addNodeParser(new EnumNodeParserWithNames(program.getTypeChecker()));
    });

    // Create formatter with our custom formatters
    // The augmentor runs BEFORE built-in formatters are added, so our formatters take priority
    const formatter = tsj.createFormatter(config, (fmt, circularReferenceTypeFormatter) => {
        // Add our AnnotatedTypeFormatter first - it will intercept AnnotatedType before the built-in one
        fmt.addTypeFormatter(new AnnotatedTypeFormatterWithIntegers(circularReferenceTypeFormatter));
        // Add our enum formatter
        fmt.addTypeFormatter(new EnumTypeFormatterWithVarnames());
    });

    const generator = new tsj.SchemaGenerator(program, parser, formatter, config);
    const schema = generator.createSchema(config.type);

    // Count enums with varnames
    const definitions = schema.definitions || {};
    let enumCount = 0;
    for (const [name, def] of Object.entries(definitions)) {
        if (def['x-enum-varnames']) {
            enumCount++;
            console.error(`  ✓ ${name}: ${def['x-enum-varnames'].length} enum members`);
        }
    }
    console.error(`  📊 Added x-enum-varnames to ${enumCount} enums`);

    // Write output
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    console.error(`✅ JSON Schema written to: ${outputPath}`);
} catch (error) {
    console.error('❌ Error generating schema:', error.message);
    console.error(error.stack);
    process.exit(1);
}
