export default {};

export function getRandomBytes(size) {
    const array = new Uint8Array(size);
    return crypto.getRandomValues(array);
}