/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    Base64ToBigInt,
    Base64ToHex,
    Base64ToUint8Array,
    BigIntToBase64,
    Uint8ArrayToBase64,
    asBase64,
} from './base64';

const data = 'SU0eXImjhI1aq6VO7sLhH2ycct1iTg2KMY2x4so5WYY=';

describe('base64', () => {
    it('base64ToHash', async () => {
        // expect(Base64ToHash()).toThrow();
        expect(Base64ToHex(data)).toEqual('0x494d1e5c89a3848d5aaba54eeec2e11f6c9c72dd624e0d8a318db1e2ca395986');
    });

    it('uint8ArrayToBase64/base64ToUint8Array', async () => {
        expect(Uint8ArrayToBase64(Base64ToUint8Array(data) as Uint8Array)).toEqual(data);
    });

    it('base64ToBigInt/bigIntToBase64', async () => {
        expect(BigIntToBase64(Base64ToBigInt(data) as bigint)).toEqual(data);
    });

    describe('asBase64', () => {
        it('should accept valid base64 strings', () => {
            const validStrings = [
                'SGVsbG8gV29ybGQ=',
                'VGVzdA==',
                'YWJjZGVm',
                'MTIzNDU2Nzg5MA==',
                '',
                'QQ==',
                'QUI=',
                'QUJD',
            ];

            validStrings.forEach((str) => {
                expect(() => asBase64(str)).not.toThrow();
                expect(asBase64(str)).toBe(str);
            });
        });

        it('should reject invalid base64 strings', () => {
            const invalidStrings = ['Hello World!', 'Test@123', 'invalid base64', 'abc===', '====', 'QQ=QQ', 'QQ=Q='];

            invalidStrings.forEach((str) => {
                expect(() => asBase64(str)).toThrow('Not a valid base64');
            });
        });
    });
});
