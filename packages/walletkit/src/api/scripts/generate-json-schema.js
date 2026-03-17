#!/usr/bin/env node
/* eslint-disable no-console */
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

const INTEGER_FORMATS = [
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'uint',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'timestamp',
];

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

    createType(node) {
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

        // Handle frozen format — strip original type completely
        if (def.format === 'frozen') {
            const frozenDef = { type: 'object', 'x-frozen': true };
            if (def.description) frozenDef.description = def.description;
            return frozenDef;
        }

        // Fix number type with integer format
        if (def.type === 'number' && def.format && INTEGER_FORMATS.includes(def.format)) {
            def.type = 'integer';
        }

        return def;
    }

    getChildren(type) {
        // Don't generate child types for frozen fields
        const annotations = type.getAnnotations ? type.getAnnotations() : {};
        if (annotations.format === 'frozen') {
            return [];
        }
        return super.getChildren(type);
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

        const isDiscriminated = typeNode.types.every((member) => this.isDiscriminatedMember(member));
        if (!isDiscriminated) {
            return false;
        }

        return true;
    }

    /**
     * Check if any union member has a value property that references the parent type
     */
    hasRecursiveReference(unionNode, parentTypeName) {
        for (const member of unionNode.types) {
            if (member.kind !== ts.SyntaxKind.TypeLiteral) continue;

            for (const prop of member.members) {
                if (prop.kind !== ts.SyntaxKind.PropertySignature) continue;
                if (!prop.type) continue;

                if (this.typeReferencesName(prop.type, parentTypeName)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if a type node references a given type name (directly or in arrays)
     */
    typeReferencesName(typeNode, name) {
        // Direct type reference
        if (typeNode.kind === ts.SyntaxKind.TypeReference) {
            const typeName = typeNode.typeName?.getText();
            if (typeName === name) {
                return true;
            }
        }
        // Array type (e.g., RawStackItem[])
        if (typeNode.kind === ts.SyntaxKind.ArrayType) {
            return this.typeReferencesName(typeNode.elementType, name);
        }
        // Union type
        if (typeNode.kind === ts.SyntaxKind.UnionType) {
            return typeNode.types.some((t) => this.typeReferencesName(t, name));
        }
        return false;
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

            // Check if this is a recursive reference (e.g., RawStackItem[] in RawStackItem)
            const isRecursive = this.typeReferencesName(valuePropNode.type, typeName);

            let valueType;
            if (isRecursive) {
                // For recursive types, create an array type with a reference
                // This avoids infinite recursion during parsing
                valueType = new tsj.ArrayType(new tsj.DefinitionType(typeName, new tsj.AnyType()));
            } else {
                valueType = this.childNodeParser.createType(valuePropNode.type, context);
            }

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
        const primitiveKinds = [
            ts.SyntaxKind.StringKeyword,
            ts.SyntaxKind.NumberKeyword,
            ts.SyntaxKind.BooleanKeyword,
            ts.SyntaxKind.UnknownKeyword,
            ts.SyntaxKind.AnyKeyword,
        ];
        if (primitiveKinds.includes(typeNode.kind)) {
            return true;
        }
        // Handle all array types including recursive ones like RawStackItem[]
        // Swift can handle indirect enums with recursive associated values
        if (typeNode.kind === ts.SyntaxKind.ArrayType) {
            return true;
        }
        // Handle type references (e.g., SomeOtherType)
        if (typeNode.kind === ts.SyntaxKind.TypeReference) {
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
        this.currentTypeName = null;
    }

    supportsType(type) {
        if (type instanceof DiscriminatedUnionType) {
            return true;
        }
        if (!(type instanceof tsj.UnionType) || type.getTypes().length < 2) {
            return false;
        }
        const isDiscriminated = type.getTypes().every((variant) => this.getDiscriminatorValue(variant) !== null);
        if (!isDiscriminated) {
            return false;
        }
        // Skip types with recursive references (e.g., RawStackItem with value: RawStackItem[])
        // These cause issues with Swift code generators
        if (this.hasRecursiveReference(type)) {
            return false;
        }
        return true;
    }

    /**
     * Check if any union variant has a value property that is an array type
     * Arrays in value properties of discriminated unions cause issues with Swift generators
     */
    hasRecursiveReference() {
        // Don't skip any discriminated unions - Swift can handle recursive enums with `indirect`
        return false;
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
// Generic Interface Types
// ============================================================================

/**
 * Type for generic interfaces that carries type parameter metadata.
 * Used to preserve generic type parameters through the schema generation pipeline.
 */
class GenericInterfaceType extends tsj.BaseType {
    constructor(name, innerType, typeParameters) {
        super();
        this.name = name;
        this.innerType = innerType;
        this.typeParameters = typeParameters; // Array of {name, constraint?, default?}
    }

    getId() {
        return `generic-${this.name}`;
    }

    getName() {
        return this.name;
    }

    getInnerType() {
        return this.innerType;
    }

    getTypeParameters() {
        return this.typeParameters;
    }
}

// ============================================================================
// Generic Interface Parser
// ============================================================================

/**
 * Parser for interface declarations with type parameters.
 * Detects generic interfaces and preserves type parameter information.
 */
class GenericInterfaceNodeParser {
    constructor(typeChecker, childNodeParser) {
        this.typeChecker = typeChecker;
        this.childNodeParser = childNodeParser;
    }

    supportsNode(node) {
        return (
            node.kind === ts.SyntaxKind.InterfaceDeclaration && node.typeParameters && node.typeParameters.length > 0
        );
    }

    createType(node, context) {
        const interfaceName = node.name.getText();

        // Extract type parameters with their constraints and defaults
        const typeParameters = node.typeParameters.map((param) => {
            const paramInfo = {
                name: param.name.getText(),
            };

            // Extract constraint (e.g., <T extends SomeType>)
            if (param.constraint) {
                paramInfo.constraint = param.constraint.getText();
            }

            // Extract default (e.g., <T = DefaultType>)
            if (param.default) {
                paramInfo.default = param.default.getText();
            }

            return paramInfo;
        });

        // Create a set of type parameter names for reference detection
        const typeParamNames = new Set(typeParameters.map((p) => p.name));

        // Parse the interface members manually to handle generic type references
        const properties = [];
        for (const member of node.members) {
            if (member.kind === ts.SyntaxKind.PropertySignature) {
                const propName = member.name.getText();
                const isOptional = !!member.questionToken;

                // Check if the property type references a generic type parameter
                let propType;
                let genericTypeRef = null;

                if (member.type) {
                    const typeText = member.type.getText();
                    if (typeParamNames.has(typeText)) {
                        // Property uses a generic type parameter directly
                        genericTypeRef = typeText;
                        propType = new tsj.AnyType(); // Placeholder
                    } else {
                        // Parse the type normally
                        propType = this.childNodeParser.createType(member.type, context);
                    }
                } else {
                    propType = new tsj.AnyType();
                }

                // Extract JSDoc description
                let description;
                const jsDocComments = ts.getJSDocCommentsAndTags(member);
                const mainComment = jsDocComments.find((c) => ts.isJSDoc(c));
                if (mainComment && mainComment.comment) {
                    description =
                        typeof mainComment.comment === 'string'
                            ? mainComment.comment.trim()
                            : mainComment.comment
                                  .map((c) => c.text)
                                  .join('')
                                  .trim();
                }

                properties.push({
                    name: propName,
                    type: propType,
                    required: !isOptional,
                    description,
                    genericTypeRef,
                });
            }
        }

        // Create a custom object type that can carry generic type reference info
        const innerType = new GenericPropertiesObjectType(interfaceName, properties);

        // Wrap in GenericInterfaceType
        const genericType = new GenericInterfaceType(interfaceName, innerType, typeParameters);

        return new tsj.DefinitionType(interfaceName, genericType);
    }
}

/**
 * Custom object type that carries property metadata including generic type references.
 */
class GenericPropertiesObjectType extends tsj.BaseType {
    constructor(name, properties) {
        super();
        this.name = name;
        this.properties = properties;
    }

    getId() {
        return `generic-props-${this.name}`;
    }

    getProperties() {
        return this.properties;
    }
}

// ============================================================================
// Generic Interface Formatters
// ============================================================================

/**
 * Formatter for generic interfaces that adds x-generic-params extension.
 */
class GenericInterfaceTypeFormatter {
    constructor(childTypeFormatter) {
        this.childTypeFormatter = childTypeFormatter;
    }

    supportsType(type) {
        return type instanceof GenericInterfaceType;
    }

    getDefinition(type) {
        const innerType = type.getInnerType();
        const properties = {};
        const required = [];

        // Format properties, preserving generic type references
        for (const prop of innerType.getProperties()) {
            const propDef = {};

            if (prop.genericTypeRef) {
                // Property uses a generic type parameter
                propDef['x-generic-type-ref'] = prop.genericTypeRef;
            } else {
                // Get the normal type definition
                const typeDef = this.childTypeFormatter.getDefinition(prop.type);
                Object.assign(propDef, typeDef);
            }

            if (prop.description) {
                propDef.description = prop.description;
            }

            properties[prop.name] = propDef;

            if (prop.required) {
                required.push(prop.name);
            }
        }

        // Build the schema definition
        const definition = {
            type: 'object',
            properties,
        };

        if (required.length > 0) {
            definition.required = required;
        }

        // Add generic parameters extension
        definition['x-is-generic'] = true;
        definition['x-generic-params'] = type.getTypeParameters().map((param) => {
            const paramDef = { name: param.name };
            // Note: We don't include constraint/default as Swift doesn't support them in the same way
            return paramDef;
        });

        return definition;
    }

    getChildren(type) {
        const children = [];
        const innerType = type.getInnerType();

        for (const prop of innerType.getProperties()) {
            if (!prop.genericTypeRef) {
                children.push(...this.childTypeFormatter.getChildren(prop.type));
            }
        }

        return children;
    }
}

/**
 * Formatter for GenericPropertiesObjectType (used as inner type of generic interfaces).
 */
class GenericPropertiesObjectTypeFormatter {
    constructor(childTypeFormatter) {
        this.childTypeFormatter = childTypeFormatter;
    }

    supportsType(type) {
        return type instanceof GenericPropertiesObjectType;
    }

    getDefinition(type) {
        const properties = {};
        const required = [];

        for (const prop of type.getProperties()) {
            const propDef = {};

            if (prop.genericTypeRef) {
                propDef['x-generic-type-ref'] = prop.genericTypeRef;
            } else {
                const typeDef = this.childTypeFormatter.getDefinition(prop.type);
                Object.assign(propDef, typeDef);
            }

            if (prop.description) {
                propDef.description = prop.description;
            }

            properties[prop.name] = propDef;

            if (prop.required) {
                required.push(prop.name);
            }
        }

        const definition = {
            type: 'object',
            properties,
        };

        if (required.length > 0) {
            definition.required = required;
        }

        return definition;
    }

    getChildren(type) {
        const children = [];
        for (const prop of type.getProperties()) {
            if (!prop.genericTypeRef) {
                children.push(...this.childTypeFormatter.getChildren(prop.type));
            }
        }
        return children;
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
// Custom Schema Generator
// ============================================================================

/**
 * Custom SchemaGenerator that ensures all root types are included in definitions.
 * When using type: '*', the standard generator only includes types that are
 * referenced by other types. This custom generator wraps root types in
 * DefinitionType so they are all included.
 */
class AllTypesSchemaGenerator extends tsj.SchemaGenerator {
    /**
     * Override to allow generic interfaces through to the parser.
     * The base class skips generic types, but we want to process them
     * with our custom GenericInterfaceNodeParser.
     */
    isGenericType(node) {
        // Allow generic interfaces - they will be handled by GenericInterfaceNodeParser
        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
            return false;
        }
        // Keep default behavior for type aliases
        return !!(node.typeParameters && node.typeParameters.length > 0);
    }

    createSchemaFromNodes(rootNodes) {
        const roots = rootNodes.map((rootNode) => {
            const rootType = this.nodeParser.createType(rootNode, new tsj.Context());
            return { rootNode, rootType };
        });

        const definitions = {};

        for (const root of roots) {
            // Wrap root type in DefinitionType if it isn't already
            let wrappedType = root.rootType;
            if (!(wrappedType instanceof tsj.DefinitionType)) {
                // Try to get the type name from the node
                const name = this.getTypeName(root.rootNode);
                if (name) {
                    wrappedType = new tsj.DefinitionType(name, root.rootType);
                }
            }

            // Get children including the wrapped root type
            this.appendRootChildDefinitions(wrappedType, definitions);
        }

        return {
            $schema: 'http://json-schema.org/draft-07/schema#',
            definitions,
        };
    }

    getTypeName(node) {
        if (node.name) {
            return node.name.getText ? node.name.getText() : node.name.escapedText;
        }
        return null;
    }

    appendRootChildDefinitions(rootType, childDefinitions) {
        const seen = new Set();

        const children = this.typeFormatter
            .getChildren(rootType)
            .filter((child) => child instanceof tsj.DefinitionType)
            .filter((child) => {
                const id = child.getId();
                if (!seen.has(id)) {
                    seen.add(id);
                    return true;
                }
                return false;
            });

        for (const child of children) {
            const name = child.getName();
            if (!(name in childDefinitions)) {
                childDefinitions[name] = this.typeFormatter.getDefinition(child.getType());
            }
        }
    }
}

// ============================================================================
// Post-processing: Interface Discriminated Unions
// ============================================================================

/**
 * Convert a string to camelCase.
 */
function toCamelCase(str) {
    if (str.includes('_')) {
        return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    // PascalCase to camelCase
    if (str.length > 0 && str[0] === str[0].toUpperCase() && str[0] !== str[0].toLowerCase()) {
        return str[0].toLowerCase() + str.slice(1);
    }
    return str;
}

/**
 * Extract type name from a $ref string like "#/components/schemas/TestWithMessage"
 */
function typeNameFromRef(ref) {
    const parts = ref.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
}

/**
 * Detect if a schema object is an interface discriminated union.
 * ts-json-schema-generator generates: allOf with if/then conditionals, properties with enum for discriminator.
 * Returns { discriminatorField, cases: [{rawValue, ref}] } or null.
 */
function detectDiscriminatedUnion(schemaDef) {
    if (!schemaDef.allOf || !Array.isArray(schemaDef.allOf)) return null;

    // Find if/then entries in allOf
    const ifThenEntries = schemaDef.allOf.filter((item) => item.if && item.then);
    if (ifThenEntries.length === 0) return null;

    // Extract discriminator field and cases from if/then entries
    let discriminatorField = null;
    const cases = [];

    for (const entry of ifThenEntries) {
        const ifProps = entry.if?.properties;
        if (!ifProps) continue;

        const fieldNames = Object.keys(ifProps);
        if (fieldNames.length !== 1) continue;

        const fieldName = fieldNames[0];
        const constValue = ifProps[fieldName]?.const;
        if (constValue === undefined) continue;

        const ref = entry.then?.$ref;
        if (!ref) continue;

        if (discriminatorField === null) {
            discriminatorField = fieldName;
        } else if (discriminatorField !== fieldName) {
            return null; // Inconsistent discriminator fields
        }

        cases.push({ rawValue: String(constValue), ref });
    }

    if (!discriminatorField || cases.length === 0) return null;
    return { discriminatorField, cases };
}

/**
 * Build a discriminated union schema from detected cases.
 * Returns the transformed definition.
 */
function buildInterfaceUnionSchema(discriminatorField, cases) {
    const properties = {};

    for (const { rawValue, ref } of cases) {
        const caseName = toCamelCase(rawValue);
        const propKey = `x_${caseName}`;

        properties[propKey] = {
            allOf: [{ $ref: ref }],
            'x-enum-case-name': caseName,
            'x-enum-case-raw-value': rawValue,
        };
    }

    return {
        type: 'object',
        properties,
        'x-discriminated-union': true,
        'x-interface-union': true,
        'x-discriminator-field': discriminatorField,
    };
}

/**
 * Process member types: remove discriminator property, add x-constant-fields.
 */
function processDiscriminatorMemberTypes(cases, discriminatorField, definitions) {
    for (const { rawValue, ref } of cases) {
        const memberName = typeNameFromRef(ref);
        const memberDef = definitions[memberName];
        if (!memberDef || !memberDef.properties) continue;

        // Skip if already processed (member may participate in multiple unions)
        if (memberDef['x-constant-fields']) continue;

        const discProp = memberDef.properties[discriminatorField];
        if (!discProp) continue;

        // Get the constant value
        const constantValue = discProp.const || (discProp.enum && discProp.enum[0]) || rawValue;

        // Remove discriminator from properties
        delete memberDef.properties[discriminatorField];

        // Remove from required
        if (memberDef.required) {
            memberDef.required = memberDef.required.filter((r) => r !== discriminatorField);
            if (memberDef.required.length === 0) {
                delete memberDef.required;
            }
        }

        // Add constant fields extension
        memberDef['x-constant-fields'] = [
            {
                name: discriminatorField,
                value: String(constantValue),
                type: 'String',
            },
        ];
    }
}

/**
 * Post-process schema to transform interface discriminated unions.
 * Handles both top-level type aliases and inline property unions.
 *
 * ts-json-schema-generator generates discriminated unions as:
 * { allOf: [{ if: { properties: { name: { const: "value" } } }, then: { $ref: "..." } }, ...] }
 */
function postProcessDiscriminatedUnions(schema) {
    const definitions = schema.definitions || {};

    for (const typeDef of Object.values(definitions)) {
        // Case A: Top-level discriminated union
        const topLevel = detectDiscriminatedUnion(typeDef);
        if (topLevel) {
            const unionSchema = buildInterfaceUnionSchema(topLevel.discriminatorField, topLevel.cases);
            // Replace definition in-place
            Object.keys(typeDef).forEach((k) => delete typeDef[k]);
            Object.assign(typeDef, unionSchema);
            processDiscriminatorMemberTypes(topLevel.cases, topLevel.discriminatorField, definitions);

            // Detect empty and single-field variants
            const singleFieldCodingKeys = new Set();
            for (const { rawValue, ref } of topLevel.cases) {
                const memberName = typeNameFromRef(ref);
                const memberDef = definitions[memberName];
                if (!memberDef?.properties) continue;

                const propKeys = Object.keys(memberDef.properties);
                const caseName = toCamelCase(rawValue);
                const propKey = `x_${caseName}`;
                const caseProp = typeDef.properties[propKey];
                if (!caseProp) continue;

                if (propKeys.length === 0) {
                    // Empty variant: no properties after discriminator removal
                    caseProp['x-empty-variant'] = true;
                } else if (propKeys.length === 1) {
                    // Single-field variant: inline the field as associated value
                    const fieldName = propKeys[0];
                    const fieldSchema = memberDef.properties[fieldName];
                    const isRequired = memberDef.required?.includes(fieldName) ?? false;

                    // Preserve existing vendor extensions
                    const vendorExts = {};
                    for (const [k, v] of Object.entries(caseProp)) {
                        if (k.startsWith('x-')) vendorExts[k] = v;
                    }

                    // Replace case property schema with the field's schema
                    Object.keys(caseProp).forEach((k) => delete caseProp[k]);
                    if (fieldSchema.$ref) {
                        caseProp.allOf = [{ $ref: fieldSchema.$ref }];
                    } else {
                        Object.assign(caseProp, { ...fieldSchema });
                    }

                    // Restore + add vendor extensions
                    Object.assign(caseProp, vendorExts);
                    caseProp['x-single-field-variant'] = true;
                    caseProp['x-single-field-name'] = fieldName;
                    if (!isRequired) {
                        caseProp['x-single-field-optional'] = true;
                    }

                    singleFieldCodingKeys.add(fieldName);

                    // Mark member for suppression
                    memberDef['x-skip-model'] = true;
                }
            }

            // Add unique coding keys for single-field variants
            if (singleFieldCodingKeys.size > 0) {
                typeDef['x-single-field-coding-keys'] = [...singleFieldCodingKeys].map((k) => ({ name: k }));
            }
            continue;
        }

        // Case B: Inline discriminated union properties
        // Instead of creating a synthetic top-level type, add vendor extensions
        // to the property and parent type so the template renders a nested enum.
        if (!typeDef.properties) continue;
        for (const [propName, propDef] of Object.entries(typeDef.properties)) {
            const inlineUnion = detectDiscriminatedUnion(propDef);
            if (!inlineUnion) continue;

            // Process member types first so we can detect empty variants
            processDiscriminatorMemberTypes(inlineUnion.cases, inlineUnion.discriminatorField, definitions);

            // Build case data with type names for template rendering
            const inlineSingleFieldCodingKeys = new Set();
            const cases = inlineUnion.cases.map(({ rawValue, ref }) => {
                const memberName = typeNameFromRef(ref);
                const memberDef = definitions[memberName];
                const propKeys = memberDef?.properties ? Object.keys(memberDef.properties) : [];

                if (propKeys.length === 0) {
                    return {
                        caseName: toCamelCase(rawValue),
                        rawValue,
                        typeName: typeNameFromRef(ref),
                        emptyVariant: true,
                    };
                } else if (propKeys.length === 1) {
                    const fieldName = propKeys[0];
                    const isRequired = memberDef.required?.includes(fieldName) ?? false;
                    inlineSingleFieldCodingKeys.add(fieldName);
                    memberDef['x-skip-model'] = true;
                    return {
                        caseName: toCamelCase(rawValue),
                        rawValue,
                        typeName: typeNameFromRef(ref),
                        singleFieldVariant: true,
                        singleFieldName: fieldName,
                        ...(!isRequired && { singleFieldOptional: true }),
                    };
                } else {
                    return {
                        caseName: toCamelCase(rawValue),
                        rawValue,
                        typeName: typeNameFromRef(ref),
                    };
                }
            });

            // Add inline union info to parent type for nested enum rendering
            if (!typeDef['x-inline-interface-unions']) {
                typeDef['x-inline-interface-unions'] = [];
            }
            typeDef['x-inline-interface-unions'].push({
                propertyName: propName,
                discriminatorField: inlineUnion.discriminatorField,
                cases,
                ...(inlineSingleFieldCodingKeys.size > 0 && {
                    singleFieldCodingKeys: [...inlineSingleFieldCodingKeys].map((k) => ({ name: k })),
                }),
            });

            // Replace property with simple object type + marker
            // The template will override the type to use the nested enum name
            Object.keys(propDef).forEach((k) => delete propDef[k]);
            propDef.type = 'object';
            propDef['x-interface-union'] = true;
        }
    }
}

/**
 * Post-process schema to convert single-literal properties to constant fields.
 * Properties with { const: "value" } or { enum: ["singleValue"] } become x-constant-fields.
 */
function postProcessConstantFields(schema) {
    const definitions = schema.definitions || {};

    for (const typeDef of Object.values(definitions)) {
        if (!typeDef.properties) continue;

        for (const [propName, propDef] of Object.entries(typeDef.properties)) {
            // Detect single-literal: { const: "value" } or { enum: ["value"] }
            let constantValue = null;
            if (propDef.const !== undefined) {
                constantValue = String(propDef.const);
            } else if (propDef.enum && Array.isArray(propDef.enum) && propDef.enum.length === 1) {
                constantValue = String(propDef.enum[0]);
            }
            if (constantValue === null) continue;

            // Remove from properties
            delete typeDef.properties[propName];

            // Remove from required
            if (typeDef.required) {
                typeDef.required = typeDef.required.filter((r) => r !== propName);
                if (typeDef.required.length === 0) {
                    delete typeDef.required;
                }
            }

            // Add to x-constant-fields
            if (!typeDef['x-constant-fields']) {
                typeDef['x-constant-fields'] = [];
            }
            typeDef['x-constant-fields'].push({
                name: propName,
                value: constantValue,
                type: 'String',
            });
        }
    }
}

/**
 * Post-process schema to convert pure $ref definitions (type aliases) into
 * x-type-alias markers so openapi-generator will create a file and the
 * template can emit a Swift typealias.
 */
/**
 * Post-process schema to strip `default` values from properties.
 * @default JSDoc is documentation-only and should not produce default values in generated code.
 */
function postProcessStripDefaults(schema) {
    const definitions = schema.definitions || {};
    for (const typeDef of Object.values(definitions)) {
        if (!typeDef.properties) continue;
        for (const propDef of Object.values(typeDef.properties)) {
            delete propDef.default;
        }
    }
}

function postProcessTypeAliases(schema) {
    const definitions = schema.definitions || {};

    for (const [, typeDef] of Object.entries(definitions)) {
        if (typeDef.$ref && !typeDef.type && !typeDef.properties && !typeDef.allOf && !typeDef['x-enum-case-name']) {
            const targetName = typeNameFromRef(typeDef.$ref);

            Object.keys(typeDef).forEach((k) => delete typeDef[k]);
            typeDef.type = 'object';
            typeDef.properties = { _alias: { type: 'string' } };
            typeDef['x-type-alias'] = true;
            typeDef['x-alias-target'] = targetName;
        }
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
        prs.addNodeParser(new GenericInterfaceNodeParser(typeChecker, prs));
    });

    const formatter = tsj.createFormatter(config, (fmt, circularReferenceTypeFormatter) => {
        fmt.addTypeFormatter(new OpenAPIDefinitionTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new OpenAPIReferenceTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new AnnotatedTypeFormatterWithIntegers(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new EnumTypeFormatterWithVarnames());
        fmt.addTypeFormatter(new SyntheticValueTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new DiscriminatedUnionTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new GenericInterfaceTypeFormatter(circularReferenceTypeFormatter));
        fmt.addTypeFormatter(new GenericPropertiesObjectTypeFormatter(circularReferenceTypeFormatter));
    });

    const generator = new AllTypesSchemaGenerator(program, parser, formatter, config);
    const schema = generator.createSchema(config.type);

    // Post-process: transform @discriminator annotated unions into discriminated union schemas
    postProcessDiscriminatedUnions(schema);

    // Post-process: convert single-literal properties to constant fields
    postProcessConstantFields(schema);

    // Post-process: strip @default values (documentation-only, not for codegen)
    postProcessStripDefaults(schema);

    // Post-process: convert pure $ref definitions (type aliases) to x-type-alias
    postProcessTypeAliases(schema);

    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
