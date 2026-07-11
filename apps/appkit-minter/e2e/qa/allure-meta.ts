/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { feature, label } from 'allure-js-commons';

/**
 * Attach grouping metadata to the current test (`feature` + `sub-suite` labels),
 * matching the demo-wallet e2e convention. The top-level `Suite` custom field is
 * left to allure-playwright's file-path default.
 *
 * @param subSuite  area name, e.g. "Transfer", "Mint", "Relayer errors".
 */
export async function gaslessMeta(subSuite: string): Promise<void> {
    await feature('Gasless');
    await label('sub-suite', subSuite);
}
