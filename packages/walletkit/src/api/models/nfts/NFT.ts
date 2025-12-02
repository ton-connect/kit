import { Address, Hex } from "../core/primitives";
import { TokenInfo } from "../core/TokenInfo";
import { NFTAttribute } from "./NFTAttribute";
import { NFTCollection } from "./NFTCollection";

export interface NFT {
    /**
     * NFT address
     */
    address: Address;

    /**
     * The index of the item within its collection
     */
    index?: string;

    /**
     * Information about the NFT token
     */
    info?: TokenInfo;

    // ????
    attributes?: NFTAttribute[];

    /**
     * Information about the collection this item belongs to
     */
    collection?: NFTCollection;

    /**
     * The address of the auction contract, if applicable.
     */
    auctionContractAddress?: Address;

    /**
     * The hash of the item's smart contract code
     */
    codeHash?: Hex;

    /**
     * The hash of the item's data in the blockchain
     */
    dataHash?: Hex;

    /**
     * The indicator if the item has been initialized
     */
    isInited?: boolean;

    // ????
    isSoulbound?: boolean;

    /**
     *  Whether the NFT item is on sale.
     */
    isOnSale?: boolean;

    /**
     * The address of the current owner
     */
    ownerAddress?: Address;

    /**
     * The address of the real owner (if different from ownerAddress, e.g. when on sale).
     */
    realOwnerAddress?: Address;

    /**
     * The address of the sale contract, if applicable.
     */
    saleContractAddress?: Address;

    /**
     * The content metadata of the NFT item
    */
    metadata?: { [key: string]: string };
}