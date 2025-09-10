export type EmulationError = EmulationErrorTransactionAccountNotFound;

export class EmulationErrorUnknown extends Error {
    constructor(message: string, cause?: Error | unknown) {
        super(message);
        this.name = 'EmulationErrorUnknown';
        this.cause = cause;
    }
}

export class EmulationErrorTransactionAccountNotFound extends Error {
    constructor(message: string, cause?: Error | unknown) {
        super(message);
        this.name = 'EmulationErrorTransactionAccountNotFound';
        this.cause = cause;
    }
}
