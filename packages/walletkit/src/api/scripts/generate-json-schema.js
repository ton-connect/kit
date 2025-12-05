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
// Discriminated Union Types
// ============================================================================

/**
 * Synthetic type for primitive values in discriminated unions.
 */
class SyntheticValueType extends tsj.BaseType {
    constructor(name, innerType, caseName, rawValue) {
        super();
        this.name = name;
        this.innerType = innerType;
        this.caseName = caseName;
        this.rawValue = rawValue;
    }

    getId() {
        return `synthetic-${this.name}`;
    }

    getName() {
        return this.name;
    }

    getInnerType() {
        return this.innerType;
    }

    getCaseName() {
        return this.caseName;
    }

    getRawValue() {
        return this.rawValue;
    }
}

/**
 * Wrapper for discriminated unions that carries synthetic value types.
 */
class DiscriminatedUnionType extends tsj.BaseType {
    constructor(parentName, innerUnion, syntheticTypes, caseValueRefs) {
        super();
        this.parentName = parentName;
        this.innerUnion = innerUnion;
        this.syntheticTypes = syntheticTypes;
        this.caseValueRefs = caseValueRefs;
    }

    getId() {
        return this.innerUnion.getId();
    }

    getParentName() {
        return this.parentName;
    }

    getInnerUnion() {
        return this.innerUnion;
    }

    getSyntheticTypes() {
        return this.syntheticTypes;
    }

    getCaseValueRefs() {
        return this.caseValueRefs;
    }
}

// ============================================================================
// Discriminated Union Parser
// ============================================================================

/**
 * Parser for type aliases that contain discriminated unions.
 */
class DiscriminatedUnionNodeParser {
    constructor(typeChecker, childNodeParser) {
        this.typeChecker = typeChecker;
        this.childNodeParser = childNodeParser;
    }

    supportsNode(node) {
        if (node.kind !== ts.SyntaxKind.TypeAliasDeclaration) {
            return false;
        }

        const typeNode = node.type;
        if (!typeNode || typeNode.kind !== ts.SyntaxKind.UnionType || typeNode.types.length < 2) {
            return false;
        }

        return typeNode.types.every((member) => this.isDiscriminatedMember(member));
    }

    isDiscriminatedMember(typeNode) {
        if (typeNode.kind !== ts.SyntaxKind.TypeLiteral) {
            return false;
        }

        return typeNode.members.some(
            (member) =>
                member.kind === ts.SyntaxKind.PropertySignature &&
                member.name?.getText() === 'type' &&
                member.type?.kind === ts.SyntaxKind.LiteralType,
        );
    }

    createType(node, context) {
        const typeName = node.name.getText();
        const typeNode = node.type;
        const unionType = this.childNodeParser.createType(typeNode, context);

        const syntheticTypes = [];
        const caseValueRefs = new Map();

        for (const memberNode of typeNode.types) {
            const rawValue = this.getDiscriminatorValue(memberNode);
            if (rawValue === null) continue;

            const valuePropNode = this.findPropertyNode(memberNode, 'value');
            if (!valuePropNode?.type || !this.isPrimitiveType(valuePropNode.type)) continue;

            const valueType = this.childNodeParser.createType(valuePropNode.type, context);
            const capitalizedValue = String(rawValue).charAt(0).toUpperCase() + String(rawValue).slice(1);
            const syntheticName = `${typeName}${capitalizedValue}Value`;
            const caseName = this.toCamelCase(String(rawValue));

            const syntheticType = new SyntheticValueType(syntheticName, valueType, caseName, rawValue);
            syntheticTypes.push({
                definitionType: new tsj.DefinitionType(syntheticName, syntheticType),
                rawValue,
                refName: syntheticName,
            });
            caseValueRefs.set(rawValue, syntheticName);
        }

        const resultType =
            syntheticTypes.length > 0
                ? new DiscriminatedUnionType(typeName, unionType, syntheticTypes, caseValueRefs)
                : unionType;

        return new tsj.DefinitionType(typeName, resultType);
    }

    getDiscriminatorValue(typeNode) {
        const typeProp = this.findPropertyNode(typeNode, 'type');
        if (typeProp?.type?.kind === ts.SyntaxKind.LiteralType) {
            const literal = typeProp.type.literal;
            if (literal.kind === ts.SyntaxKind.StringLiteral) {
                return literal.text;
            }
        }
        return null;
    }

    findPropertyNode(typeNode, propName) {
        return typeNode.members.find(
            (m) => m.kind === ts.SyntaxKind.PropertySignature && m.name?.getText() === propName,
        );
    }

    isPrimitiveType(typeNode) {
        const primitiveKinds = [ts.SyntaxKind.StringKeyword, ts.SyntaxKind.NumberKeyword, ts.SyntaxKind.BooleanKeyword];
        if (primitiveKinds.includes(typeNode.kind)) {
            return true;
        }
        if (typeNode.kind === ts.SyntaxKind.TypeLiteral) {
            const members = typeNode.members;
            return members.length === 1 && members[0].kind === ts.SyntaxKind.IndexSignature;
        }
        return false;
    }

    toCamelCase(str) {
        if (str.includes('_')) {
            return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        }
        return str;
    }
}

// ============================================================================
// Discriminated Union Formatters
// ============================================================================

/**
 * Formatter for synthetic value types.
 */
class SyntheticValueTypeFormatter {
    constructor(childTypeFormatter) {
        this.childTypeFormatter = childTypeFormatter;
    }

    supportsType(type) {
        return type instanceof SyntheticValueType;
    }

    getDefinition(type) {
        const innerDef = this.childTypeFormatter.getDefinition(type.getInnerType());
        return {
            ...innerDef,
            'x-enum-case-name': type.getCaseName(),
            'x-enum-case-raw-value': type.getRawValue(),
        };
    }

    getChildren(type) {
        return this.childTypeFormatter.getChildren(type.getInnerType());
    }
}

/**
 * Formatter for discriminated unions with Swift-compatible extensions.
 */
class DiscriminatedUnionTypeFormatter {
    constructor(childTypeFormatter) {
        this.childTypeFormatter = childTypeFormatter;
    }

    supportsType(type) {
        if (type instanceof DiscriminatedUnionType) {
            return true;
        }
        if (!(type instanceof tsj.UnionType) || type.getTypes().length < 2) {
            return false;
        }
        return type.getTypes().every((variant) => this.getDiscriminatorValue(variant) !== null);
    }

    getDiscriminatorValue(type) {
        const derefed = this.derefType(type);
        if (derefed instanceof tsj.ObjectType) {
            const typeProp = derefed.getProperties().find((p) => p.getName() === 'type');
            if (typeProp) {
                const propType = this.derefType(typeProp.getType());
                if (propType instanceof tsj.LiteralType) {
                    return propType.getValue();
                }
            }
        }
        return null;
    }

    getAssociatedValueType(type) {
        const derefed = this.derefType(type);
        if (derefed instanceof tsj.ObjectType) {
            const valueProp = derefed.getProperties().find((p) => p.getName() === 'value');
            return valueProp?.getType() ?? null;
        }
        return null;
    }

    derefType(type) {
        if (type instanceof tsj.DefinitionType) {
            return this.derefType(type.getType());
        }
        if (type instanceof tsj.AnnotatedType) {
            return this.derefType(type.getType());
        }
        return type;
    }

    getDefinition(type) {
        const union = type instanceof DiscriminatedUnionType ? type.getInnerUnion() : type;
        const caseValueRefs = type instanceof DiscriminatedUnionType ? type.getCaseValueRefs() : new Map();

        const enumCases = [];
        const valueProperties = {};
        const discriminatorValues = [];

        for (const variant of union.getTypes()) {
            const typeValue = this.getDiscriminatorValue(variant);
            if (typeValue === null) continue;

            discriminatorValues.push(typeValue);
            const camelCaseName = this.toCamelCase(String(typeValue));
            const caseInfo = { name: camelCaseName, rawValue: typeValue, hasAssociatedValue: false };

            const valueType = this.getAssociatedValueType(variant);
            if (valueType) {
                caseInfo.hasAssociatedValue = true;
                const propName = `x_${typeValue}_value`;
                caseInfo.valuePropertyName = propName;

                const syntheticRef = caseValueRefs.get(typeValue);
                const valueDef = syntheticRef
                    ? { $ref: `#/components/schemas/${syntheticRef}` }
                    : this.childTypeFormatter.getDefinition(valueType);

                valueProperties[propName] = {
                    allOf: [valueDef.$ref ? { $ref: valueDef.$ref } : valueDef],
                    'x-enum-case-name': camelCaseName,
                    'x-enum-case-raw-value': typeValue,
                };
            }

            enumCases.push(caseInfo);
        }

        return {
            type: 'object',
            properties: {
                type: { type: 'string', enum: discriminatorValues },
                ...valueProperties,
            },
            'x-discriminated-union': true,
            'x-enum-cases': enumCases,
        };
    }

    getChildren(type) {
        const children = [];
        if (type instanceof DiscriminatedUnionType) {
            for (const synth of type.getSyntheticTypes()) {
                children.push(synth.definitionType);
            }
        }
        const union = type instanceof DiscriminatedUnionType ? type.getInnerUnion() : type;
        for (const variant of union.getTypes()) {
            const valueType = this.getAssociatedValueType(variant);
            if (valueType) {
                children.push(...this.childTypeFormatter.getChildren(valueType));
            }
        }
        return children;
    }

    toCamelCase(str) {
        if (str.includes('_')) {
            return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        }
        return str;
    }
}

// ============================================================================
// Custom Formatters for OpenAPI $ref paths
// ============================================================================

/**
 * Custom DefinitionTypeFormatter that outputs OpenAPI-style refs.
 */
class OpenAPIDefinitionTypeFormatter {
    constructor(childTypeFormatter) {
        this.childTypeFormatter = childTypeFormatter;
    }

    supportsType(type) {
        return type instanceof tsj.DefinitionType;
    }

    getDefinition(type) {
        const name = type.getName();
        return { $ref: `#/components/schemas/${encodeURIComponent(name)}` };
    }

    getChildren(type) {
        const children = [type, ...this.childTypeFormatter.getChildren(type.getType())];
        return children.filter((v, i, a) => a.indexOf(v) === i);
    }
}

/**
 * Custom ReferenceTypeFormatter that outputs OpenAPI-style refs.
 * Handles recursive type references.
 */
class OpenAPIReferenceTypeFormatter {
    constructor(childTypeFormatter) {
        this.childTypeFormatter = childTypeFormatter;
    }

    supportsType(type) {
        return type instanceof tsj.ReferenceType;
    }

    getDefinition(type) {
        const name = type.getName();
        return { $ref: `#/components/schemas/${encodeURIComponent(name)}` };
    }

    getChildren(type) {
        const referredType = type.getType();
        if (referredType instanceof tsj.DefinitionType) {
            return this.childTypeFormatter.getChildren(referredType);
        }
        return this.childTypeFormatter.getChildren(new tsj.DefinitionType(type.getName(), type.getType()));
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
    const program = tsj.createProgram(config);
    const typeChecker = program.getTypeChecker();

    const parser = tsj.createParser(program, config, (prs) => {
        prs.addNodeParser(new EnumNodeParserWithNames(typeChecker));
        prs.addNodeParser(new DiscriminatedUnionNodeParser(typeChecker, prs));
    });

    const formatter = tsj.createFormatter(config, (fmt, circularReferenceTypeFormatter) => {
        fmt.addTypeFormatter(new OpenAPIDefinitionTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new OpenAPIReferenceTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new AnnotatedTypeFormatterWithIntegers(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new EnumTypeFormatterWithVarnames());
        fmt.addTypeFormatter(new SyntheticValueTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new DiscriminatedUnionTypeFormatter(circularReferenceTypeFormatter));
    });

    const generator = new tsj.SchemaGenerator(program, parser, formatter, config);
    const schema = generator.createSchema(config.type);

    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
