import { base64ToBigInt, base64ToHash, base64ToUint8Array, bigIntToBase64, uint8ArrayToBase64 } from './base64';

const data = 'SU0eXImjhI1aq6VO7sLhH2ycct1iTg2KMY2x4so5WYY=';

describe('base64', () => {
    it('base64ToHash', async () => {
        expect(base64ToHash()).toEqual(null);
        expect(base64ToHash(data)).toEqual('0x494d1e5c89a3848d5aaba54eeec2e11f6c9c72dd624e0d8a318db1e2ca395986');
    });

    it('uint8ArrayToBase64/base64ToUint8Array', async () => {
        expect(uint8ArrayToBase64(base64ToUint8Array(data) as Uint8Array)).toEqual(data);
    });

    it('base64ToBigInt/bigIntToBase64', async () => {
        expect(bigIntToBase64(base64ToBigInt(data) as bigint)).toEqual(data);
    });
});
