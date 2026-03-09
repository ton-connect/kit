/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface Contact {
    name: string;
    address: string;
    network?: 'mainnet' | 'testnet';
}

export interface IContactResolver {
    resolve(userId: string, name: string): Promise<string | null>;
    addContact(userId: string, contact: Contact): Promise<void>;
    listContacts(userId: string): Promise<Contact[]>;
    removeContact(userId: string, name: string): Promise<boolean>;
}
