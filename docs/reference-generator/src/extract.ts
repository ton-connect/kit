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
    Symbol as TsSymbol,
    Type,
    TypeAliasDeclaration,
    VariableDeclaration,
} from 'ts-morph';

import type { CollectedSymbol } from './collect';

export type SymbolKind = 'function' | 'hook' | 'component' | 'componentNamespace' | 'type' | 'class' | 'unknown';

export interface ParamRow {
    name: string;
    typeText: string;
    required: boolean;
    description: string | null;
}

export interface ExtractedFunction {
    kind: 'function' | 'hook';
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

export interface ExtractedUnknown {
    kind: 'unknown';
    name: string;
    sourcePath: string;
    section: string;
    category: string;
}

export type Extracted =
    | ExtractedFunction
    | ExtractedComponent
    | ExtractedNamespaceComponent
    | ExtractedType
    | ExtractedClass
    | ExtractedUnknown;

const FORMAT_FLAGS =
    TypeFormatFlags.NoTruncation |
    TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
    TypeFormatFlags.WriteArrayAsGenericType;

type ExtractedWithoutMeta =
    | Omit<ExtractedFunction, 'section' | 'category'>
    | Omit<ExtractedComponent, 'section' | 'category'>
    | Omit<ExtractedNamespaceComponent, 'section' | 'category'>
    | Omit<ExtractedType, 'section' | 'category'>
    | Omit<ExtractedClass, 'section' | 'category'>
    | Omit<ExtractedUnknown, 'section' | 'category'>;

export function extract(collected: CollectedSymbol): Extracted {
    const { name, declaration, sourcePath } = collected;
    const isReactPackage =
        sourcePath !== '' && declaration.getSourceFile().getFilePath().includes('/appkit-react/src/');

    const inner = extractInner(name, declaration, sourcePath, isReactPackage);
    const section = collected.section ?? '';
    const category = collected.category ?? '';
    return { ...inner, section, category } as Extracted;
}

function extractInner(
    name: string,
    declaration: Node,
    sourcePath: string,
    isReactPackage: boolean,
): ExtractedWithoutMeta {
    if (Node.isInterfaceDeclaration(declaration) || Node.isTypeAliasDeclaration(declaration)) {
        return extractType(name, declaration, sourcePath);
    }

    if (Node.isClassDeclaration(declaration)) {
        return extractClass(name, declaration, sourcePath);
    }

    if (Node.isFunctionDeclaration(declaration)) {
        return extractFromFunctionDeclaration(name, declaration, sourcePath, isReactPackage);
    }

    if (Node.isVariableDeclaration(declaration)) {
        return extractFromVariableDeclaration(name, declaration, sourcePath, isReactPackage);
    }

    return { kind: 'unknown', name, sourcePath };
}

function extractFromFunctionDeclaration(
    name: string,
    decl: FunctionDeclaration,
    sourcePath: string,
    isReactPackage: boolean,
): ExtractedWithoutMeta {
    if (isReactPackage && /^use[A-Z]/.test(name)) {
        return extractFunctionLike(decl, name, sourcePath, 'hook');
    }
    if (isReactPackage && isReactComponent(decl)) {
        return extractFunctionAsComponent(decl, name, sourcePath);
    }
    return extractFunctionLike(decl, name, sourcePath, 'function');
}

function extractFromVariableDeclaration(
    name: string,
    decl: VariableDeclaration,
    sourcePath: string,
    isReactPackage: boolean,
): ExtractedWithoutMeta {
    const init = decl.getInitializer();
    if (!init) return { kind: 'unknown', name, sourcePath };

    if (Node.isObjectLiteralExpression(init) && isReactPackage && /^[A-Z]/.test(name)) {
        return extractNamespaceComponent(name, decl, init, sourcePath);
    }

    if (isReactPackage && /^use[A-Z]/.test(name) && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
        return extractVariableFunction(decl, init, name, sourcePath, 'hook');
    }

    if (isReactPackage && /^[A-Z]/.test(name) && isVariableReactComponent(decl, init)) {
        return extractVariableAsComponent(decl, name, sourcePath);
    }

    if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
        return extractVariableFunction(decl, init, name, sourcePath, 'function');
    }

    return { kind: 'unknown', name, sourcePath };
}

function extractFunctionLike(
    decl: FunctionDeclaration,
    name: string,
    sourcePath: string,
    kind: 'function' | 'hook',
): Omit<ExtractedFunction, 'section' | 'category'> {
    const jsdoc = pickJsDoc(decl.getJsDocs());
    const summary = readSummary(jsdoc);
    const paramTags = readParamTags(jsdoc);
    const returnDescription = readReturnDescription(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);

    const params = expandParameters(decl.getParameters(), decl, paramTags);
    const returnTypeText = formatType(decl.getReturnType(), decl);

    return { kind, name, sourcePath, summary, params, returnTypeText, returnDescription, examples, samples };
}

function extractVariableFunction(
    decl: VariableDeclaration,
    init: Node,
    name: string,
    sourcePath: string,
    kind: 'function' | 'hook',
): Omit<ExtractedFunction, 'section' | 'category'> {
    const stmt = decl.getVariableStatement();
    const jsdoc = pickJsDoc(stmt?.getJsDocs() ?? []);
    const summary = readSummary(jsdoc);
    const paramTags = readParamTags(jsdoc);
    const returnDescription = readReturnDescription(jsdoc);
    const examples = readExamples(jsdoc);
    const samples = readSamples(jsdoc);

    if (!Node.isArrowFunction(init) && !Node.isFunctionExpression(init)) {
        return {
            kind,
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

    const params = expandParameters(init.getParameters(), decl, paramTags);
    const returnTypeText = formatType(init.getReturnType(), decl);

    return { kind, name, sourcePath, summary, params, returnTypeText, returnDescription, examples, samples };
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
    const constructorParams = expandParameters(ctor.getParameters(), decl, ctorParamTags);
    return { kind: 'class', name, sourcePath, summary, constructorParams, examples, samples };
}

function expandParameters(
    params: ParameterDeclaration[],
    contextNode: Node,
    paramTags: Map<string, string>,
): ParamRow[] {
    const rows: ParamRow[] = [];

    for (const param of params) {
        const paramName = param.getName();
        const paramType = param.getType();
        const required = !param.hasQuestionToken() && !param.hasInitializer() && !param.isRestParameter();

        const shouldFlatten =
            (paramName === 'options' || paramName === 'parameters') && isFlattenableObjectType(paramType);

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

function isReactComponent(decl: FunctionDeclaration): boolean {
    const ret = decl.getReturnType();
    return isReactReturnType(ret.getText(decl, FORMAT_FLAGS));
}

function isVariableReactComponent(decl: VariableDeclaration, init: Node): boolean {
    if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
        const ret = init.getReturnType();
        if (isReactReturnType(ret.getText(decl, FORMAT_FLAGS))) return true;
    }
    const declTypeText = decl.getType().getText(decl, FORMAT_FLAGS);
    if (declTypeText.includes('ForwardRefExoticComponent')) return true;
    if (declTypeText.includes('FC<') || declTypeText.includes('FunctionComponent')) return true;

    const callSig = decl.getType().getCallSignatures()[0];
    if (callSig) {
        return isReactReturnType(callSig.getReturnType().getText(decl, FORMAT_FLAGS));
    }
    return false;
}

function isReactReturnType(text: string): boolean {
    return /\b(JSX\.Element|ReactElement|ReactNode|Element)\b/.test(text);
}

const MAX_TYPE_LENGTH = 240;

function formatType(type: Type, contextNode: Node): string {
    const raw = type.getText(contextNode, FORMAT_FLAGS).replace(/\s+/g, ' ');
    if (raw.length <= MAX_TYPE_LENGTH) return raw;
    return raw.slice(0, MAX_TYPE_LENGTH) + '… /* truncated */';
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

/**
 * Replaces JSDoc inline tags ({@link Foo}, {@linkcode Foo}, etc.) with their
 * label/target text, then escapes any remaining `{`/`}` so the output is safe
 * to embed in MDX (where `{` starts a JS expression).
 */
function sanitizeJsDocText(text: string): string {
    const withoutInlineTags = text.replace(
        /\{@(link|linkcode|linkplain|inheritDoc|see|tutorial|label)\s+([^}]*)\}/g,
        (_, _tag: string, body: string) => {
            const trimmed = body.trim();
            const pipeIdx = trimmed.indexOf('|');
            if (pipeIdx >= 0) return trimmed.slice(pipeIdx + 1).trim();
            return trimmed;
        },
    );
    return withoutInlineTags.replace(/[{}]/g, (m) => `\\${m}`).trim();
}
