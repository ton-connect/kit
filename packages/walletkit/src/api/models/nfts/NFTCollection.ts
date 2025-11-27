import { TokenImage } from "../core/TokenImage";
import { Address, Hex } from "../core/primitives";

export interface NFTCollection {
    address: Address;
    name?: string;
    image?: TokenImage;
    description?: string;
    codeHash?: Hex;
    dataHash?: Hex;
    ownerAddress?: Address;
    content?: { [key: string]: string };
    extra?: { [key: string]: unknown };
}