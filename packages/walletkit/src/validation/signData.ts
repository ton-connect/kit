import { SignDataPayload } from '@tonconnect/protocol';

type ValidationResult = string | null;
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const BOC_PREFIX = 'te6cc';

function isValidObject(data: unknown): data is SignDataPayload {
    return typeof data === 'object' && data !== null;
}

function isValidString(data: unknown): data is string {
    return typeof data === 'string';
}

function hasExtraProperties(data: unknown, allowedKeys: string[]): boolean {
    return typeof data === 'object' && data !== null && Object.keys(data).some((key) => !allowedKeys.includes(key));
}

function isValidBoc(value: unknown): value is string {
    return typeof value === 'string' && BASE64_REGEX.test(value) && value.startsWith(BOC_PREFIX);
}

export function validateSignDataPayload(data: unknown): ValidationResult {
    if (!isValidObject(data)) {
        return 'Payload must be an object';
    }

    if (!isValidString(data.type)) {
        return "'type' is required";
    }

    switch (data.type) {
        case 'text':
            return validateSignDataPayloadText(data);
        case 'binary':
            return validateSignDataPayloadBinary(data);
        case 'cell':
            return validateSignDataPayloadCell(data);
        default:
            return "Invalid 'type' value";
    }
}

function validateSignDataPayloadText(data: Record<string, unknown>): ValidationResult {
    const allowedKeys = ['type', 'text', 'network', 'from'];
    if (hasExtraProperties(data, allowedKeys)) {
        return 'Text payload contains extra properties';
    }

    if (!isValidString(data.text)) {
        return "'text' is required";
    }

    if (data.network !== undefined) {
        if (!isValidString(data.network) || !/^-?\d+$/.test(data.network)) {
            return "Invalid 'network' format";
        }
    }

    if (data.from !== undefined && !isValidString(data.from)) {
        return "Invalid 'from'";
    }

    return null;
}

function validateSignDataPayloadBinary(data: Record<string, unknown>): ValidationResult {
    const allowedKeys = ['type', 'bytes', 'network', 'from'];
    if (hasExtraProperties(data, allowedKeys)) {
        return 'Binary payload contains extra properties';
    }

    if (!isValidString(data.bytes)) {
        return "'bytes' is required";
    }

    if (data.network !== undefined) {
        if (!isValidString(data.network) || !/^-?\d+$/.test(data.network)) {
            return "Invalid 'network' format";
        }
    }

    if (data.from !== undefined && !isValidString(data.from)) {
        return "Invalid 'from'";
    }

    return null;
}

function validateSignDataPayloadCell(data: Record<string, unknown>): ValidationResult {
    const allowedKeys = ['type', 'schema', 'cell', 'network', 'from'];
    if (hasExtraProperties(data, allowedKeys)) {
        return 'Cell payload contains extra properties';
    }

    if (!isValidString(data.schema)) {
        return "'schema' is required";
    }

    if (!isValidString(data.cell)) {
        return "'cell' is required";
    }

    if (!isValidBoc(data.cell)) {
        return "Invalid 'cell' format (must be valid base64)";
    }

    if (data.network !== undefined) {
        if (!isValidString(data.network) || !/^-?\d+$/.test(data.network)) {
            return "Invalid 'network' format";
        }
    }

    if (data.from !== undefined && !isValidString(data.from)) {
        return "Invalid 'from'";
    }

    return null;
}
