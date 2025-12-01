import { Error, Result } from "../core/Primitives";
import { TransactionsEmulation } from "./emulation/TransactionsEmulation";

export type TransactionPreview = TransactionPreviewEmulationError | TransactionPreviewEmulationResult;

export interface TransactionPreviewEmulationError {
    result: Result;
    emulationError: Error;
}

export interface TransactionPreviewEmulationResult {
    result: Result;
    emulationResult?: TransactionsEmulation;
}