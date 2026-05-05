/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Minimal password satisfying requirements (>= 4 chars) with varied characters
export const TEST_PASSWORD = 'Te1!';

// 500 chars, satisfies minimum length requirement — used to verify no length limit crash
export const LONG_PASSWORD = 'Te1!' + 'x'.repeat(496);

// Satisfies minimum length requirement (> 4 chars) — used to verify XSS is not executed
export const XSS_PASSWORD_PAYLOAD = '<Script>alert(1)</Script>Abc1';
