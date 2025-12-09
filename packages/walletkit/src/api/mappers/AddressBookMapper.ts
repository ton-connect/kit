/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBookRowV3 } from "../../types/toncenter/v3/AddressBookRowV3";
import type { AddressBook } from "../models/core/AddressBook";
import { Mapper } from "./Mapper";
import { AddressBookEntryMapper } from "./AddressBookEntryMapper";
import { UserFriendlyAddressMapper } from "./UserFriendlyAddressMapper";

/**
 * Maps Record<string, AddressBookRowV3> to API AddressBook model.
 * Converts keys to user-friendly addresses and skips entries that fail conversion.
 */
export class AddressBookMapper extends Mapper<
  Record<string, AddressBookRowV3>,
  AddressBook
> {
  private entryMapper = new AddressBookEntryMapper();
  private addressMapper = new UserFriendlyAddressMapper();

  map(input: Record<string, AddressBookRowV3>): AddressBook {
    const addressBook: AddressBook = {};
    for (const [rawAddress, row] of Object.entries(input)) {
      const userFriendlyAddress = this.addressMapper.map(rawAddress);
      // Skip entries where address conversion fails
      if (userFriendlyAddress !== undefined) {
        addressBook[userFriendlyAddress] = this.entryMapper.map(row);
      }
    }
    return addressBook;
  }
}
