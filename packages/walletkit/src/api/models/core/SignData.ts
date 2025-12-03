import { Base64String } from "./Primitives";

export type SignData = 
    | { type: 'text', value: SignDataText }
    | { type: 'binary', value: SignDataBinary }
    | { type: 'cell', value: SignDataCell };

export declare type SignDataBinary = {
    /**
     * @format byte
     */
    content: string;
};

export declare type SignDataCell = {
    schema: string;
    content: Base64String;
};

export declare type SignDataText = {
    content: string;
};
