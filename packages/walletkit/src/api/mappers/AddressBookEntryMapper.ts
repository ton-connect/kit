/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBookRowV3 } from "../../types/toncenter/v3/AddressBookRowV3";
import type { AddressBookEntry } from "../models/core/AddressBook";
import { Mapper } from "./Mapper";

/**
 * Maps AddressBookRowV3 to API AddressBookEntry model.
 */
export class AddressBookEntryMapper extends Mapper<
  AddressBookRowV3,
  AddressBookEntry
> {
  map(input: AddressBookRowV3): AddressBookEntry {
    return {
      userFriendly: input.user_friendly,
      domain: input.domain ?? undefined,
    };
  }
}
