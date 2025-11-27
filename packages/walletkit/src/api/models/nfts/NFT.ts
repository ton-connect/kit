import { Address, Hex } from "../core/primitives";
import { TokenInfo } from "../core/TokenInfo";
import { NFTAttribute } from "./NFTAttribute";
import { NFTCollection } from "./NFTCollection";

export interface NFT {
    address: Address;
    index?: string;
    info?: TokenInfo;
    attributes?: NFTAttribute[];
    collection?: NFTCollection;
    auctionContractAddress?: Address;
    codeHash?: Hex;
    dataHash?: Hex;
    isInited?: boolean;
    isSoulbound?: boolean;
    isOnSale?: boolean;
    onwerAddress?: Address;
    realOwnerAddress?: Address;
    saleContractAddress?: Address;
    content?: { [key: string]: string };
}