/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Base mapper interface for converting between types.
 * @template Input - The source type to map from
 * @template Output - The target type to map to
 */
export abstract class Mapper<Input, Output> {
  /**
   * Maps the input type to the output type.
   * @param input - The source object to map
   * @returns The mapped output object
   */
  abstract map(input: Input): Output;
}
