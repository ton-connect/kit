/**
 * Test model for validating TypeScript to Kotlin/Swift code generation.
 * This interface covers all common primitive types and their mappings.
 */
export interface TestModel {
    // ============ STRING TYPES ============
    
    /**
     * Basic required string
     */
    requiredString: string;
    
    /**
     * Optional string
     */
    optionalString?: string;

    // ============ NUMBER TYPES ============
    
    /**
     * Basic number (maps to Double/BigDecimal by default)
     */
    basicNumber: number;
    
    /**
     * Integer number
     * @format int32
     */
    intNumber: number;
    
    /**
     * Long integer
     * @format int64
     */
    longNumber: number;
    
    /**
     * Float number
     * @format float
     */
    floatNumber: number;
    
    /**
     * Double number
     * @format double
     */
    doubleNumber: number;

    // ============ BOOLEAN TYPE ============
    
    /**
     * Required boolean
     */
    requiredBoolean: boolean;
    
    /**
     * Optional boolean
     */
    optionalBoolean?: boolean;

    // ============ DATE TYPES ============
    
    /**
     * Date-time field
     */
    dateTime: Date;
    
    /**
     * Optional date
     */
    optionalDate?: Date;

    // ============ ARRAY TYPES ============
    
    /**
     * Array of strings
     */
    stringArray: string[];
    
    /**
     * Array of integers
     */
    intArray: number[];
    
    /**
     * Array of booleans
     */
    boolArray: boolean[];

    // ============ SPECIAL TYPES ============
    
    /**
     * Unknown/Any type
     */
    anyValue?: unknown;
    
    /**
     * Nullable string (explicitly null)
     */
    nullableString: string | null;

    // ============ TYPE ALIASES ============
    
    /**
     * Hex string alias
     */
    hexValue: HexString;
    
    /**
     * Base64 string alias
     */
    base64Value: Base64String;
    
    /**
     * BigInt as string (for large numbers)
     * @format bigint
     */
    bigIntValue: string;
}

/**
 * Enum for testing enum generation
 */
export enum TestStatus {
    PENDING = "pending",
    ACTIVE = "active", 
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

/**
 * Model with enum field
 */
export interface ModelWithEnum {
    id: string;
    status: TestStatus;
    optionalStatus?: TestStatus;
}

/**
 * Nested model for testing object composition
 */
export interface NestedModel {
    name: string;
    value: number;
}

/**
 * Model with nested objects
 */
export interface ModelWithNested {
    id: string;
    nested: NestedModel;
    optionalNested?: NestedModel;
    nestedArray: NestedModel[];
}

// Type aliases
type HexString = string;
type Base64String = string;