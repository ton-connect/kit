
export type Address = string; // User-friendly address representation
export type Hex = string; // Hexadecimal string representation
export type Base64String = string; // Base64-encoded string representation
export type LogicalTime = string;

export declare enum Result {
    success = 'success',
    failure = 'failure',
}

export interface ResultError {
    /**
     * Error code representing the type of error
     */
    code?: number;

    /**
     * Human-readable error message
     */
    message?: string;

    /**
     * Additional error data
     */
    data?: { [key: string]: unknown };
}

export interface Pagination {
    /**
     * Maximum number of items to return
     * @format int
     */
    limit?: number;

    /**
     * Number of items to skip before starting to collect the result set
     * @format int
     */
    offset?: number;
}