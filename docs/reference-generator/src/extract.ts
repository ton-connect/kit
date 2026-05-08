/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Node, TypeFormatFlags } from 'ts-morph';
import type {
    ClassDeclaration,
    FunctionDeclaration,
    InterfaceDeclaration,
    JSDoc,
    JSDocParameterTag,
    ObjectLiteralExpression,
    ParameterDeclaration,
    Type,
    TypeAliasDeclaration,
    VariableDeclaration,
} from 'ts-morph';

import type { CollectedSymbol } from './collect';

export type SymbolKind = 'function' | 'component' | 'componentNamespace' | 'type' | 'class';

export const VALID_CATEGORIES = ['Class', 'Action', 'Hook', 'Component', 'Type'] as const;
export type ValidCategory = (typeof VALID_CATEGORIES)[number];

const CATEGORY_TO_KIND: Record<ValidCategory, SymbolKind> = {
    Class: 'class',
    Action: 'function',
    Hook: 'function',
    Component: 'component',
    Type: 'type',
};

export interface ParamRow {
    name: string;
    typeText: string;
    required: boolean;
    description: string | null;
}

export interface ExtractedFunction {
    kind: 'function';
    name: string;
    sourcePath: string;
    section: string;
    category: string;
    summary: string | null;
    params: ParamRow[];
    returnTypeText: string;
    returnDescription: string | null;
    examples: string[];
    samples: string[];
}

export interface ExtractedComponent {
    kind: 'component';
    name: string;
    sourcePath: string;
    section: string;
    category: string;
    summary: string | null;
    props: ParamRow[];
    examples: string[];
    samples: string[];
}

export interface ExtractedNamespaceComponent {
    kind: 'componentNamespace';
    name: string;
    sourcePath: string;
    section: string;
    category: string;
    summary: string | null;
    members: { name: string; props: ParamRow[]; summary: string | null }[];
}

export interface ExtractedType {
    kind: 'type';
    name: string;
    sourcePath: string;
    section: string;
    category: string;
    summary: string | null;
    fields: ParamRow[] | null;
    typeText: string | null;
}

export interface ExtractedClass {
    kind: 'class';
    name: string;
    sourcePath: string;
    section: string;
    category: string;
    summary: string | null;
    constructorParams: ParamRow[] | null;
    examples: string[];
    samples: string[];
}

export type Extracted =
    | ExtractedFunction
    | ExtractedComponent
    | ExtractedNamespaceComponent
    | ExtractedType
    | ExtractedClass;

const FORMAT_FLAGS =
    TypeFormatFlags.NoTruncation |
    TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
    TypeFormatFlags.WriteArrayAsGenericType;

type ExtractedWithoutMeta =
    | Omit<ExtractedFunction, 'section' | 'category'>
    | Omit<ExtractedComponent, 'section' | 'category'>
    | Omit<ExtractedNamespaceComponent, 'section' | 'category'>
    | Omit<ExtractedType, 'section' | 'category'>
    | Omit<ExtractedClass, 'section' | 'category'>;

export function extract(collected: CollectedSymbol): Extracted {
    const { name, declaration, sourcePath } = collected;
    const category = collected.category ?? '';

    if (!isValidCategory(category)) {
        throw new Error(`[${name}] Invalid @category "${category}". Allowed values: ${VALID_CATEGORIES.join(', ')}.`);
    }

    const inner = extractByCategory(category, name, declaration, sourcePath);
    const section = collected.section ?? '';
    return { ...inner, section, category } as Extracted;
}

function isValidCategory(value: string): value is ValidCategory {
    return (VALID_CATEGORIES as readonly string[]).includes(value);
}

function extractByCategory(
    category: ValidCategory,
    name: string,
    declaration: Node,
    sourcePath: string,
): ExtractedWithoutMeta {
    const expectedKind = CATEGORY_TO_KIND[category];

    switch (expectedKind) {
        case 'type':
            if (Node.isInterfaceDeclaration(declaration) || Node.isTypeAliasDeclaration(declaration)) {
                return extractType(name, declaration, sourcePath);
            }
            throw mismatch(name, category, 'interface or type alias');

        case 'class':
            if (Node.isClassDeclaration(declaration)) {
                return extractClass(name, declaration, sourcePath);
            }
            throw mismatch(name, category, 'class declaration');

        case 'function':
            if (Node.isFunctionDeclaration(declaration)) {
                return extractFunctionLike(declaration, name, sourcePath);
            }
            if (Node.isVariableDeclaration(declaration)) {
                const init = declaration.getInitializer();
                if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
                    return extractVariableFunction(declaration, init, name, sourcePath);
                }
            }
            throw mismatch(name, category, 'function declaration or arrow/function variable');

        case 'component':
            if (Node.isVariableDeclaration(declaration)) {
                const init = declaration.getInitializer();
                if (init && Node.isObjectLiteralExpression(init)) {
                    return extractNamespaceComponent(name, declaration, init, sourcePath);
                }
                return extractVariableAsComponent(declaration, name, sourcePath);
            }
            if (Node.isFunctionDeclaration(declaration)) {
                return extractFunctionAsComponent(declaration, name, sourcePath);
            }
            throw mismatch(name, category, 'function or variable declaration');

        case 'componentNamespace':
            // Reached via category=Component → handled inside the 'component' branch above.
            throw new Error(`Unreachable: componentNamespace must be derived from Component category`);
    }
}

function mismatch(name: string, category: ValidCategory, expected: string): Error {
    return new Error(`[${name}] @category ${category} requires the symbol to be a ${expected}.`);
}

function extractFunctionLike(
    decl: FunctionDeclaration,
    name: string,
    sourcePath: string,
): Omit<ExtractedFunction, 'section' | 'category'> {
    const jsdoc = pickJsDoc(decl.getJsDocs());
    const summary = readSummary(jsdoc);
    const paramTags = readParamTags(jsdoc);
    const returnDescription = readReturnDescription(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);
    const expandNames = readExpandNames(jsdoc);

    const params = expandParameters(decl.getParameters(), decl, paramTags, expandNames);
    const returnTypeText = formatType(decl.getReturnType(), decl);

    return {
        kind: 'function',
        name,
        sourcePath,
        summary,
        params,
        returnTypeText,
        returnDescription,
        examples,
        samples,
    };
}

function extractVariableFunction(
    decl: VariableDeclaration,
    init: Node,
    name: string,
    sourcePath: string,
): Omit<ExtractedFunction, 'section' | 'category'> {
    const stmt = decl.getVariableStatement();
    const jsdoc = pickJsDoc(stmt?.getJsDocs() ?? []);
    const summary = readSummary(jsdoc);
    const paramTags = readParamTags(jsdoc);
    const returnDescription = readReturnDescription(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);
    const expandNames = readExpandNames(jsdoc);

    if (!Node.isArrowFunction(init) && !Node.isFunctionExpression(init)) {
        return {
            kind: 'function',
            name,
            sourcePath,
            summary,
            params: [],
            returnTypeText: 'unknown',
            returnDescription,
            examples,
            samples,
        };
    }

    const params = expandParameters(init.getParameters(), decl, paramTags, expandNames);
    const returnTypeText = formatType(init.getReturnType(), decl);

    return {
        kind: 'function',
        name,
        sourcePath,
        summary,
        params,
        returnTypeText,
        returnDescription,
        examples,
        samples,
    };
}

function extractFunctionAsComponent(
    decl: FunctionDeclaration,
    name: string,
    sourcePath: string,
): Omit<ExtractedComponent, 'section' | 'category'> {
    const jsdoc = pickJsDoc(decl.getJsDocs());
    const summary = readSummary(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);
    const props = expandComponentProps(decl.getParameters(), decl);
    return { kind: 'component', name, sourcePath, summary, props, examples, samples };
}

function extractVariableAsComponent(
    decl: VariableDeclaration,
    name: string,
    sourcePath: string,
): Omit<ExtractedComponent, 'section' | 'category'> {
    const stmt = decl.getVariableStatement();
    const jsdoc = pickJsDoc(stmt?.getJsDocs() ?? []);
    const summary = readSummary(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);

    const init = decl.getInitializer();
    let propsType: Type | null = null;

    if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
        const params = init.getParameters();
        if (params.length > 0) propsType = params[0].getType();
    } else {
        const callSig = decl.getType().getCallSignatures()[0];
        const propsParam = callSig?.getParameters()[0];
        if (propsParam) {
            propsType = propsParam.getValueDeclaration()?.getType() ?? null;
        }
    }

    const props = propsType ? readPropsFromType(propsType, decl) : [];
    return { kind: 'component', name, sourcePath, summary, props, examples, samples };
}

function extractNamespaceComponent(
    name: string,
    decl: VariableDeclaration,
    init: ObjectLiteralExpression,
    sourcePath: string,
): Omit<ExtractedNamespaceComponent, 'section' | 'category'> {
    const stmt = decl.getVariableStatement();
    const jsdoc = pickJsDoc(stmt?.getJsDocs() ?? []);
    const summary = readSummary(jsdoc);

    const members: ExtractedNamespaceComponent['members'] = [];
    for (const prop of init.getProperties()) {
        if (!Node.isPropertyAssignment(prop) && !Node.isShorthandPropertyAssignment(prop)) continue;
        const memberName = prop.getName();
        const memberType = prop.getType();
        const callSig = memberType.getCallSignatures()[0];
        const propsParam = callSig?.getParameters()[0];
        const propsType = propsParam?.getValueDeclaration()?.getType() ?? null;
        const props = propsType ? readPropsFromType(propsType, decl) : [];
        members.push({ name: memberName, props, summary: null });
    }

    return { kind: 'componentNamespace', name, sourcePath, summary, members };
}

function extractType(
    name: string,
    decl: InterfaceDeclaration | TypeAliasDeclaration,
    sourcePath: string,
): Omit<ExtractedType, 'section' | 'category'> {
    const jsdoc = pickJsDoc(decl.getJsDocs());
    const summary = readSummary(jsdoc);

    if (Node.isInterfaceDeclaration(decl)) {
        const fields = readPropsFromType(decl.getType(), decl);
        return { kind: 'type', name, sourcePath, summary, fields, typeText: null };
    }

    const typeNode = decl.getTypeNode();
    if (typeNode && Node.isTypeLiteral(typeNode)) {
        const fields = readPropsFromType(decl.getType(), decl);
        return { kind: 'type', name, sourcePath, summary, fields, typeText: null };
    }

    const typeText = typeNode ? typeNode.getText() : decl.getType().getText(decl, FORMAT_FLAGS);
    return { kind: 'type', name, sourcePath, summary, fields: null, typeText };
}

function extractClass(
    name: string,
    decl: ClassDeclaration,
    sourcePath: string,
): Omit<ExtractedClass, 'section' | 'category'> {
    const jsdoc = pickJsDoc(decl.getJsDocs());
    const summary = readSummary(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);
    const ctor = decl.getConstructors()[0];
    if (!ctor) {
        return { kind: 'class', name, sourcePath, summary, constructorParams: null, examples, samples };
    }
    const ctorJsDoc = pickJsDoc(ctor.getJsDocs());
    const ctorParamTags = readParamTags(ctorJsDoc);
    const ctorExpandNames = readExpandNames(ctorJsDoc);
    const constructorParams = expandParameters(ctor.getParameters(), decl, ctorParamTags, ctorExpandNames);
    return { kind: 'class', name, sourcePath, summary, constructorParams, examples, samples };
}

function expandParameters(
    params: ParameterDeclaration[],
    contextNode: Node,
    paramTags: Map<string, string>,
    expandNames: Set<string>,
): ParamRow[] {
    const rows: ParamRow[] = [];

    for (const param of params) {
        const paramName = param.getName();
        const paramType = param.getType();
        const required = !param.hasQuestionToken() && !param.hasInitializer() && !param.isRestParameter();

        const shouldFlatten = expandNames.has(paramName) && isFlattenableObjectType(paramType);

        if (shouldFlatten) {
            rows.push({
                name: paramName,
                typeText: formatType(paramType, contextNode),
                required,
                description: paramTags.get(paramName) ?? null,
            });
            const declaredFields = readPropsFromType(paramType, contextNode);
            for (const field of declaredFields) {
                const tagKey = `${paramName}.${field.name}`;
                rows.push({
                    ...field,
                    name: `${paramName}.${field.name}`,
                    description: field.description ?? paramTags.get(tagKey) ?? null,
                });
            }
            continue;
        }

        rows.push({
            name: paramName,
            typeText: formatType(paramType, contextNode),
            required,
            description: paramTags.get(paramName) ?? null,
        });
    }

    return rows;
}

function expandComponentProps(params: ParameterDeclaration[], contextNode: Node): ParamRow[] {
    if (params.length === 0) return [];
    const propsParam = params[0];
    return readPropsFromType(propsParam.getType(), contextNode);
}

function readPropsFromType(type: Type, contextNode: Node): ParamRow[] {
    const rows: ParamRow[] = [];
    for (const prop of type.getProperties()) {
        const propName = prop.getName();
        if (propName.startsWith('__@')) continue;

        const valueDecl = prop.getValueDeclaration() ?? prop.getDeclarations()[0];
        if (!valueDecl) continue;

        const declPath = valueDecl.getSourceFile().getFilePath();
        if (declPath.includes('/node_modules/')) continue;
        if (declPath.includes('/typescript/lib/lib.')) continue;

        const propType = prop.getTypeAtLocation(contextNode);
        const optional = (prop.getFlags() & 16777216) !== 0; // ts.SymbolFlags.Optional
        const description = readPropertyJsDoc(valueDecl);
        rows.push({
            name: prop.getName(),
            typeText: formatType(propType, contextNode),
            required: !optional,
            description,
        });
    }
    return rows;
}

function isFlattenableObjectType(type: Type): boolean {
    if (type.isUnion() || type.isIntersection()) return false;
    if (!type.isObject()) return false;
    if (type.getCallSignatures().length > 0) return false;
    if (type.getConstructSignatures().length > 0) return false;
    return type.getProperties().length > 0;
}

function formatType(type: Type, contextNode: Node): string {
    return type.getText(contextNode, FORMAT_FLAGS).replace(/\s+/g, ' ');
}

function pickJsDoc(jsDocs: JSDoc[]): JSDoc | null {
    return jsDocs.length > 0 ? jsDocs[jsDocs.length - 1] : null;
}

function readSummary(jsdoc: JSDoc | null): string | null {
    if (!jsdoc) return null;
    const desc = sanitizeJsDocText(jsdoc.getDescription());
    return desc || null;
}

function readParamTags(jsdoc: JSDoc | null): Map<string, string> {
    const map = new Map<string, string>();
    if (!jsdoc) return map;
    for (const tag of jsdoc.getTags()) {
        if (tag.getTagName() !== 'param') continue;
        const paramTag = tag as JSDocParameterTag;
        const nameNode = paramTag.getNameNode();
        if (!nameNode) continue;
        const name = nameNode.getText();
        const comment = sanitizeJsDocText(stripTsDocDash(paramTag.getCommentText() ?? ''));
        if (comment) map.set(name, comment);
    }
    return map;
}

/** TSDoc writes `@param name - description`; strip the leading dash. */
function stripTsDocDash(text: string): string {
    return text.replace(/^\s*[-–—]\s*/, '');
}

function readExamples(jsdoc: JSDoc | null): string[] {
    if (!jsdoc) return [];
    const out: string[] = [];
    for (const tag of jsdoc.getTags()) {
        if (tag.getTagName() !== 'example') continue;
        const text = tag.getCommentText()?.trim();
        if (text) out.push(text);
    }
    return out;
}

function readExpandNames(jsdoc: JSDoc | null): Set<string> {
    const out = new Set<string>();
    if (!jsdoc) return out;
    for (const tag of jsdoc.getTags()) {
        if (tag.getTagName() !== 'expand') continue;
        const text = tag.getCommentText()?.trim();
        if (text) out.add(text);
    }
    return out;
}

function readSamples(jsdoc: JSDoc | null): string[] {
    if (!jsdoc) return [];
    const out: string[] = [];
    for (const tag of jsdoc.getTags()) {
        if (tag.getTagName() !== 'sample') continue;
        const text = tag.getCommentText()?.trim();
        if (!text) continue;
        if (!text.includes('#')) {
            throw new Error(`Invalid @sample value: "${text}". Expected format \`dir/path#SAMPLE_NAME\`.`);
        }
        out.push(text);
    }
    return out;
}

function readReturnDescription(jsdoc: JSDoc | null): string | null {
    if (!jsdoc) return null;
    for (const tag of jsdoc.getTags()) {
        const tagName = tag.getTagName();
        if (tagName !== 'returns' && tagName !== 'return') continue;
        const comment = sanitizeJsDocText(stripTsDocDash(tag.getCommentText() ?? ''));
        return comment || null;
    }
    return null;
}

function readPropertyJsDoc(node: Node): string | null {
    if (!Node.isJSDocable(node)) return null;
    const docs = node.getJsDocs();
    if (docs.length === 0) return null;
    const desc = sanitizeJsDocText(docs[docs.length - 1].getDescription());
    return desc || null;
}

export const LINK_MARKER_OPEN = ' LINK:';
export const LINK_MARKER_CLOSE = '';

/**
 * Replaces JSDoc inline tags with sanitized text. {@link Foo} survives as a
 * sentinel marker (LINK_MARKER_OPEN…LINK_MARKER_CLOSE) so the renderer can
 * later turn it into a markdown link if `Foo` is itself documented in the
 * same reference. Other inline tags ({@linkcode}, {@see}, …) collapse to
 * their target/label text. Loose `{`/`}` are escaped so MDX doesn't treat
 * them as JS expressions.
 */
function sanitizeJsDocText(text: string): string {
    let result = text.replace(
        /\{@link\s+([^}|]+?)(?:\s*\|\s*[^}]*)?\}/g,
        (_, target: string) => `${LINK_MARKER_OPEN}${target.trim()}${LINK_MARKER_CLOSE}`,
    );
    result = result.replace(
        /\{@(linkcode|linkplain|inheritDoc|see|tutorial|label)\s+([^}]*)\}/g,
        (_, _tag: string, body: string) => {
            const trimmed = body.trim();
            const pipeIdx = trimmed.indexOf('|');
            if (pipeIdx >= 0) return trimmed.slice(pipeIdx + 1).trim();
            return trimmed;
        },
    );
    return result.replace(/[{}]/g, (m) => `\\${m}`).trim();
}
