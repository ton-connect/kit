import { Base64ToBigInt, Base64ToHash, Base64ToUint8Array, BigIntToBase64, Uint8ArrayToBase64 } from './base64';

const data = 'SU0eXImjhI1aq6VO7sLhH2ycct1iTg2KMY2x4so5WYY=';

describe('base64', () => {
    it('base64ToHash', async () => {
        expect(Base64ToHash()).toEqual(null);
        expect(Base64ToHash(data)).toEqual('0x494d1e5c89a3848d5aaba54eeec2e11f6c9c72dd624e0d8a318db1e2ca395986');
    });

    it('uint8ArrayToBase64/base64ToUint8Array', async () => {
        expect(Uint8ArrayToBase64(Base64ToUint8Array(data) as Uint8Array)).toEqual(data);
    });

    it('base64ToBigInt/bigIntToBase64', async () => {
        expect(BigIntToBase64(Base64ToBigInt(data) as bigint)).toEqual(data);
    });
});
