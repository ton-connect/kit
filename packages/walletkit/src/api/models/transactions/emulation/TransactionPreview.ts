import { ResultError, Result } from "../../core/Primitives";
import { Transaction } from "../Transaction";

export interface TransactionPreview {
    /**
     * Emulation result
     */
    result: Result;
    
    /**
     * Emulation error
     */
    error?: ResultError;

    /**
     * Emulated transaction
     */
    transaction?: Transaction;
}