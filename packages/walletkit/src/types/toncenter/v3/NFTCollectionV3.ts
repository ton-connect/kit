import { NftCollection } from '../NftCollection';
import { asAddressFriendly, asHash, asMaybeAddressFriendly } from '../../primitive';

export interface NFTCollectionV3 {
    address: string;
    code_hash?: string;
    collection_content?: { [key: string]: never };
    data_hash?: string;
    last_transaction_lt?: string;
    next_item_index: string;
    owner_address?: string;
}

export function toNftCollection(data: NFTCollectionV3 | null): NftCollection | null {
    if (!data) return null;
    const out: NftCollection = {
        address: asAddressFriendly(data.address),
        codeHash: data.code_hash ? asHash(data.code_hash) : null,
        dataHash: data.data_hash ? asHash(data.data_hash) : null,
        nextItemIndex: BigInt(data.next_item_index),
        ownerAddress: asMaybeAddressFriendly(data.owner_address),
    };
    if (data.last_transaction_lt) out.lastTransactionLt = BigInt(data.last_transaction_lt);
    if (data.collection_content) out.collectionContent = data.collection_content;
    return out;
}
