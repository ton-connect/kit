/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnectUIError } from '@ton/appkit-ui';

/**
 * Base class for TonConnectUIReact errors. You can check if the error was triggered by the @ton/appkit-ui-react using `err instanceof TonConnectUIReactError`.
 */
export class TonConnectUIReactError extends TonConnectUIError {
    constructor(...args: ConstructorParameters<typeof Error>) {
        super(...args);

        Object.setPrototypeOf(this, TonConnectUIReactError.prototype);
    }
}
