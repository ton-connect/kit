/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Big } from '../../libs/big-number';

const DOT_NUM_REGEXP = /\d+(?:\.\d+)?/gi;

export const parseNumberFromString = (value: unknown): string => {
    if (!value) return '';

    if (typeof value === 'number') return String(value);

    if (typeof value !== 'string' && typeof value !== 'number') return '';

    let val = String(value).split(' ').join('');
    const isComma = val.indexOf(',') > -1;
    let dotIndex = val.indexOf('.');

    if (isComma && dotIndex > -1) {
        val = val.replace(/,/g, '');
    } else if (isComma) {
        const commaCount = val.split(',').length - 1;
        val = val.replace(/,/g, commaCount > 1 ? '' : '.');
    }

    dotIndex = val.indexOf('.');

    if (dotIndex === 0) val = `0${val}`;

    if (dotIndex === val.length - 1) val = `${val}0`;

    const exec = val.match(DOT_NUM_REGEXP);
    const res = exec?.[0];

    return Number.isNaN(Number(res)) || !res ? '' : Big(res).toString();
};
