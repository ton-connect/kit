import { Error, Result } from "../../core/Primitives";
import { Transaction } from "../Transaction";

export interface TransactionPreview {
    /**
     * Emulation result
     */
    result: Result;
    
    /**
     * Emulation error
     */
    error?: Error;

    /**
     * Emulated transaction
     */
    emulatedTransaction?: Transaction;
}