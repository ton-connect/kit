import { TokenImage } from "../core/TokenImage";
import { Address, Hex } from "../core/primitives";

export interface NFTCollection {
    /**
     * The blockchain address of the NFT collection contract
     */
    address: Address;

    /**
     * The name of the NFT collection
     */
    name?: string;

    /**
     * The image representing the NFT collection
     */
    image?: TokenImage;

    /**
     * A brief description of the NFT collection
     */
    description?: string;

    /**
     * The index value for the next item to be minted in the collection
     */
    nextItemIndex?: string;

    /**
     * The hash of the collection's smart contract code
     */
    codeHash?: Hex;

    /**
     * The hash of the collection's data in the blockchain
     */
    dataHash?: Hex;

    /**
     * The blockchain address of the collection owner
     */
    ownerAddress?: Address;

    /**
     * The content metadata of the collection
     */
    metadata?: { [key: string]: string };

    /**
     * Additional arbitrary data related to the NFT collection
     */
    extra?: { [key: string]: unknown };
}