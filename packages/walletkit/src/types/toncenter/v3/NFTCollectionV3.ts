import { NftCollection } from '../NftCollection';
import { asAddressFriendly, asMaybeAddressFriendly } from '../../primitive';
import { Base64ToHash } from '../../../utils/base64';

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
        codeHash: Base64ToHash(data.code_hash),
        dataHash: Base64ToHash(data.data_hash),
        nextItemIndex: BigInt(data.next_item_index),
        ownerAddress: asMaybeAddressFriendly(data.owner_address),
    };
    if (data.last_transaction_lt) out.lastTransactionLt = BigInt(data.last_transaction_lt);
    if (data.collection_content) out.collectionContent = data.collection_content;
    return out;
}
