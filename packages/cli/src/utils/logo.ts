/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import cfonts from 'cfonts';

import { dim } from './output.js';

const VERSION = '0.1.0';

export function printLogo(): void {
    const rendered = cfonts.render('TON', {
        font: 'block',
        align: 'left',
        colors: ['#0098EA', '#45AEF5'],
        gradient: ['#0098EA', '#45AEF5'],
        transitionGradient: true,
        space: false,
        env: 'node',
    });

    if (rendered && typeof rendered !== 'boolean') {
        process.stderr.write(rendered.string);
    }
    process.stderr.write(` ${dim(`TON CLI v${VERSION} — Wallet toolkit for humans and agents`)}\n\n`);
}

export function getVersion(): string {
    return VERSION;
}
