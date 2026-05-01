/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useRef } from 'react';

export const useUnmount = (func: () => void) => {
    const funcRef = useRef(func);
    funcRef.current = func;

    useEffect(() => () => funcRef.current(), []);
};
