/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @ts-expect-error - opentype.js doesn't have types
import opentype from 'opentype.js';

const FONT_URL = 'https://cdn.jsdelivr.net/gh/rsms/inter@v3.19/docs/font-files/Inter-Regular.otf';

let fontPromise: Promise<opentype.Font> | null = null;

/**
 * Load the Inter font (cached)
 */
function loadFont(): Promise<opentype.Font> {
    if (!fontPromise) {
        fontPromise = opentype.load(FONT_URL);
    }
    return fontPromise!;
}

/**
 * Convert text to SVG path data
 */
export async function textToSvgPath(text: string, fontSize: number, x: number, y: number): Promise<string> {
    const font = await loadFont();
    const path = font.getPath(text, x, y, fontSize);
    return path.toPathData(2);
}

/**
 * Get the width of text when rendered
 */
export async function getTextWidth(text: string, fontSize: number): Promise<number> {
    const font = await loadFont();
    return font.getAdvanceWidth(text, fontSize);
}
