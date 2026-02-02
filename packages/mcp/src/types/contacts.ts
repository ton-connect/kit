/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IContactResolver - Optional interface for resolving friend names to TON addresses
 *
 * Purpose: Allow users to send to "Alice" instead of raw addresses.
 * Contacts are scoped to the user who created them.
 */

/**
 * Contact information
 */
export interface Contact {
    /** Human-readable name for the contact */
    name: string;
    /** TON address */
    address: string;
    /** Optional network specification (defaults to any) */
    network?: 'mainnet' | 'testnet';
}

/**
 * Interface for contact resolution.
 * All operations are scoped to a specific user.
 */
export interface IContactResolver {
    /**
     * Resolve a contact name to an address.
     *
     * @param userId - The user's ID
     * @param name - The contact name to resolve
     * @returns The TON address or null if not found
     */
    resolve(userId: string, name: string): Promise<string | null>;

    /**
     * Add a new contact for a user.
     *
     * @param userId - The user's ID
     * @param contact - The contact to add
     */
    addContact(userId: string, contact: Contact): Promise<void>;

    /**
     * List all contacts for a user.
     *
     * @param userId - The user's ID
     * @returns Array of contacts
     */
    listContacts(userId: string): Promise<Contact[]>;

    /**
     * Remove a contact by name.
     *
     * @param userId - The user's ID
     * @param name - The contact name to remove
     * @returns true if removed, false if not found
     */
    removeContact(userId: string, name: string): Promise<boolean>;
}
