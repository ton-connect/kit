/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface UserAgent {
    os: 'ios' | 'ipad' | 'android' | 'macos' | 'windows' | 'linux' | undefined;
    browser: 'chrome' | 'firefox' | 'safari' | 'opera' | undefined;
}
