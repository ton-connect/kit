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

import { getJsDocs } from './collect';
import type { CollectedSymbol } from './collect';

export type SymbolKind = 'function' | 'component' | 'componentNamespace' | 'type' | 'class';

export const VALID_CATEGORIES = ['Class', 'Action', 'Hook', 'Component', 'Type', 'Constants'] as const;
export type ValidCategory = (typeof VALID_CATEGORIES)[number];

export interface ParamRow {
    name: string;
    typeText: string;
    /** When set, the renderer uses this name (link if documented) instead of `typeText`. */
    typeOverride: string | null;
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
    returnTypeOverride: string | null;
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
    /** True for `const X = ...` declarations; renderer uses `const`-form code block. */
    isConstant: boolean;
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
    const { name, declaration, metadataDeclaration, sourcePath } = collected;
    const category = collected.category ?? '';

    if (!isValidCategory(category)) {
        throw new Error(`[${name}] Invalid @category "${category}". Allowed values: ${VALID_CATEGORIES.join(', ')}.`);
    }

    const inner = extractByCategory(category, name, declaration, sourcePath);
    const section = collected.section ?? '';

    // For @extract re-exports, prefer the JSDoc summary from the local export comment
    // over (often missing) JSDoc on the imported declaration in the other package.
    const metadataSummary =
        metadataDeclaration !== declaration ? readSummary(pickJsDoc(getJsDocs(metadataDeclaration))) : null;
    if (metadataSummary && 'summary' in inner) {
        return { ...inner, section, category, summary: metadataSummary } as Extracted;
    }

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
    switch (category) {
        case 'Type':
            if (Node.isInterfaceDeclaration(declaration) || Node.isTypeAliasDeclaration(declaration)) {
                return extractType(name, declaration, sourcePath);
            }
            throw mismatch(name, category, 'interface or type alias');

        case 'Constants':
            if (Node.isVariableDeclaration(declaration)) {
                return extractType(name, declaration, sourcePath);
            }
            throw mismatch(name, category, 'const declaration');

        case 'Class':
            if (Node.isClassDeclaration(declaration)) {
                return extractClass(name, declaration, sourcePath);
            }
            if (Node.isTypeAliasDeclaration(declaration) && hasExtractTag(declaration)) {
                const expanded = expandClassThroughExtract(name, declaration, sourcePath);
                if (expanded) return expanded;
            }
            throw mismatch(name, category, 'class declaration or @extract type alias targeting a class');

        case 'Action':
        case 'Hook':
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

        case 'Component':
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
    const returnInfo = readReturnInfo(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);
    const expandNames = readExpandNames(jsdoc);

    const params = expandParameters(decl.getParameters(), decl, paramTags, expandNames);
    const returnTypeText = decl.getReturnTypeNode()?.getText() ?? formatType(decl.getReturnType(), decl);

    return {
        kind: 'function',
        name,
        sourcePath,
        summary,
        params,
        returnTypeText,
        returnTypeOverride: returnInfo.typeOverride,
        returnDescription: returnInfo.description,
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
    const returnInfo = readReturnInfo(jsdoc);
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
            returnTypeOverride: returnInfo.typeOverride,
            returnDescription: returnInfo.description,
            examples,
            samples,
        };
    }

    const params = expandParameters(init.getParameters(), decl, paramTags, expandNames);
    const returnTypeText =
        (Node.isArrowFunction(init) || Node.isFunctionExpression(init)
            ? init.getReturnTypeNode()?.getText()
            : undefined) ?? formatType(init.getReturnType(), decl);

    return {
        kind: 'function',
        name,
        sourcePath,
        summary,
        params,
        returnTypeText,
        returnTypeOverride: returnInfo.typeOverride,
        returnDescription: returnInfo.description,
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
    decl: InterfaceDeclaration | TypeAliasDeclaration | VariableDeclaration,
    sourcePath: string,
): Omit<ExtractedType, 'section' | 'category'> {
    if (Node.isVariableDeclaration(decl)) {
        const stmt = decl.getVariableStatement();
        const jsdoc = pickJsDoc(stmt?.getJsDocs() ?? []);
        const summary = readSummary(jsdoc);
        const init = decl.getInitializer();
        const typeText = init ? init.getText() : decl.getType().getText(decl, FORMAT_FLAGS);
        return { kind: 'type', name, sourcePath, summary, fields: null, typeText, isConstant: true };
    }

    const jsdoc = pickJsDoc(decl.getJsDocs());
    const summary = readSummary(jsdoc);

    if (Node.isTypeAliasDeclaration(decl) && hasExtractTag(decl)) {
        const expanded = expandThroughExtract(name, decl, sourcePath);
        if (expanded) {
            return { ...expanded, summary: summary ?? expanded.summary };
        }
    }

    if (Node.isInterfaceDeclaration(decl)) {
        const fields = readPropsFromType(decl.getType(), decl);
        return { kind: 'type', name, sourcePath, summary, fields, typeText: null, isConstant: false };
    }

    const typeNode = decl.getTypeNode();
    if (typeNode && Node.isTypeLiteral(typeNode)) {
        const fields = readPropsFromType(decl.getType(), decl);
        if (fields.length > 0) {
            return { kind: 'type', name, sourcePath, summary, fields, typeText: null, isConstant: false };
        }
        // Type literal without named props (e.g. only an index signature) — fall back to the source text.
        return {
            kind: 'type',
            name,
            sourcePath,
            summary,
            fields: null,
            typeText: typeNode.getText(),
            isConstant: false,
        };
    }

    const typeText = typeNode ? typeNode.getText() : decl.getType().getText(decl, FORMAT_FLAGS);
    return { kind: 'type', name, sourcePath, summary, fields: null, typeText, isConstant: false };
}

function hasExtractTag(decl: Node): boolean {
    if (!Node.isJSDocable(decl)) return false;
    for (const doc of decl.getJsDocs()) {
        for (const tag of doc.getTags()) {
            if (tag.getTagName() === 'extract') return true;
        }
    }
    return false;
}

/**
 * Resolves a `@extract`-tagged type alias to its underlying interface or type
 * declaration (typically in another package) and reuses its shape. Returns
 * null if the alias does not point at something extractable.
 */
function expandClassThroughExtract(
    name: string,
    decl: TypeAliasDeclaration,
    sourcePath: string,
): Omit<ExtractedClass, 'section' | 'category'> | null {
    const targetDecl = resolveExtractTarget(decl);
    if (!targetDecl || !Node.isClassDeclaration(targetDecl)) return null;
    const aliasJsDoc = pickJsDoc(decl.getJsDocs());
    const aliasSummary = readSummary(aliasJsDoc);
    const inner = extractClass(name, targetDecl, sourcePath);
    return { ...inner, summary: aliasSummary ?? inner.summary };
}

function expandThroughExtract(
    name: string,
    decl: TypeAliasDeclaration,
    sourcePath: string,
): Omit<ExtractedType, 'section' | 'category'> | null {
    const targetDecl = resolveExtractTarget(decl);
    if (targetDecl && (Node.isInterfaceDeclaration(targetDecl) || Node.isTypeAliasDeclaration(targetDecl))) {
        return extractType(name, targetDecl, sourcePath);
    }
    // No named target outside this declaration — fall back to the structural form.
    const typeText = decl.getType().getText(decl, FORMAT_FLAGS);
    return { kind: 'type', name, sourcePath, summary: null, fields: null, typeText, isConstant: false };
}

/**
 * Resolves a `@extract`-tagged type alias to the underlying declaration.
 * Returns null if the resolution would loop back to the alias itself
 * (which can happen when ts-morph's symbol resolver returns the alias node
 * for re-exported types — guarding here prevents infinite recursion).
 */
function resolveExtractTarget(decl: TypeAliasDeclaration): Node | null {
    // Prefer the type-node's identifier when the alias is `type X = Y` or
    // `type X = Y<…>` — `getDefinitionNodes()` follows TypeScript's resolver
    // through `import type` aliases all the way to the original class /
    // interface / type declaration, even across packages.
    const typeNode = decl.getTypeNode();
    if (typeNode && Node.isTypeReference(typeNode)) {
        const typeName = typeNode.getTypeName();
        if (Node.isIdentifier(typeName)) {
            for (const definition of typeName.getDefinitionNodes()) {
                if (definition === decl) continue;
                if (
                    Node.isClassDeclaration(definition) ||
                    Node.isInterfaceDeclaration(definition) ||
                    Node.isTypeAliasDeclaration(definition)
                ) {
                    return definition;
                }
            }
        }
    }
    // Fallback: use the resolved type's symbol chain (works for inline types).
    const aliasedType = decl.getType();
    let symbol = aliasedType.getAliasSymbol() ?? aliasedType.getSymbol();
    if (!symbol) return null;
    let next = symbol.getAliasedSymbol();
    while (next) {
        symbol = next;
        next = symbol.getAliasedSymbol();
    }
    const targetDecl = symbol.getDeclarations()[0];
    if (!targetDecl || targetDecl === decl) return null;
    return targetDecl;
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
    paramTags: Map<string, ParamTagInfo>,
    expandNames: Set<string>,
): ParamRow[] {
    const rows: ParamRow[] = [];

    for (const param of params) {
        const paramName = param.getName();
        const paramType = param.getType();
        const required = !param.hasQuestionToken() && !param.hasInitializer() && !param.isRestParameter();
        const tagInfo = paramTags.get(paramName);
        const paramSyntactic = param.getTypeNode()?.getText() ?? formatType(paramType, contextNode);

        const shouldFlatten = expandNames.has(paramName) && isFlattenableObjectType(paramType);

        if (shouldFlatten) {
            rows.push({
                name: paramName,
                typeText: paramSyntactic,
                typeOverride: tagInfo?.typeOverride ?? null,
                required,
                description: tagInfo?.description ?? null,
            });
            const declaredFields = readPropsFromType(paramType, contextNode);
            for (const field of declaredFields) {
                const tagKey = `${paramName}.${field.name}`;
                const fieldTagInfo = paramTags.get(tagKey);
                rows.push({
                    ...field,
                    name: `${paramName}.${field.name}`,
                    typeOverride: fieldTagInfo?.typeOverride ?? field.typeOverride,
                    description: field.description ?? fieldTagInfo?.description ?? null,
                });
            }
            continue;
        }

        rows.push({
            name: paramName,
            typeText: paramSyntactic,
            typeOverride: tagInfo?.typeOverride ?? null,
            required,
            description: tagInfo?.description ?? null,
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
        const syntacticType =
            (Node.isPropertySignature(valueDecl) || Node.isPropertyDeclaration(valueDecl)
                ? valueDecl.getTypeNode()?.getText()
                : undefined) ?? formatType(propType, contextNode);
        rows.push({
            name: prop.getName(),
            typeText: syntacticType,
            typeOverride: null,
            required: !optional,
            description,
        });
    }
    return rows;
}

function isFlattenableObjectType(type: Type): boolean {
    if (type.isUnion()) return false;
    // Intersections like `Params & { providerId?: string }` resolve to a clean property bag —
    // flattening them is fine as long as `getProperties()` returns something usable.
    if (type.isIntersection()) return type.getProperties().length > 0;
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

interface ParamTagInfo {
    description: string | null;
    typeOverride: string | null;
}

function readParamTags(jsdoc: JSDoc | null): Map<string, ParamTagInfo> {
    const map = new Map<string, ParamTagInfo>();
    if (!jsdoc) return map;
    for (const tag of jsdoc.getTags()) {
        if (tag.getTagName() !== 'param') continue;
        const paramTag = tag as JSDocParameterTag;
        const nameNode = paramTag.getNameNode();
        if (!nameNode) continue;
        const name = nameNode.getText();
        const raw = sanitizeJsDocText(stripTsDocDash(paramTag.getCommentText() ?? ''));
        map.set(name, splitLeadingLink(raw));
    }
    return map;
}

/**
 * If the text starts with a `{@link X}` marker (planted by sanitizeJsDocText),
 * extracts X as a type-override and returns the rest as the description.
 */
function splitLeadingLink(text: string): ParamTagInfo {
    if (text.startsWith(LINK_MARKER_OPEN)) {
        const end = text.indexOf(LINK_MARKER_CLOSE, LINK_MARKER_OPEN.length);
        if (end !== -1) {
            const target = text.slice(LINK_MARKER_OPEN.length, end).trim();
            const remaining = text.slice(end + LINK_MARKER_CLOSE.length).trim();
            return { typeOverride: target, description: remaining || null };
        }
    }
    return { typeOverride: null, description: text || null };
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

function readReturnInfo(jsdoc: JSDoc | null): ParamTagInfo {
    const empty: ParamTagInfo = { description: null, typeOverride: null };
    if (!jsdoc) return empty;
    for (const tag of jsdoc.getTags()) {
        const tagName = tag.getTagName();
        if (tagName !== 'returns' && tagName !== 'return') continue;
        const raw = sanitizeJsDocText(stripTsDocDash(tag.getCommentText() ?? ''));
        return splitLeadingLink(raw);
    }
    return empty;
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
