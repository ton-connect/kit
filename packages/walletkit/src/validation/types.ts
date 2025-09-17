// Validation-related types and interfaces

/**
 * Result of a validation operation
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

export interface ReturnWithValidationResult<T> extends ValidationResult {
    result: T;
}

/**
 * Validation rule definition
 */
export interface ValidationRule<T = unknown> {
    name: string;
    validate: (value: T) => ValidationResult;
    description?: string;
}

/**
 * Validation context for more complex validations
 */
export interface ValidationContext {
    strict?: boolean;
    allowEmpty?: boolean;
    customRules?: ValidationRule[];
}

/**
 * Field validation error
 */
export interface FieldValidationError {
    field: string;
    value: unknown;
    message: string;
    code?: string;
}
