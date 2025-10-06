// PBKDF2 implementation using native Swift bridge
// This replaces react-native-fast-pbkdf2 for iOS Kit

const implementation = {
    derive(password, salt, iterations, keySize, hash) {
        return window.Pbkdf2.derive(password, salt, iterations, keySize, hash);
    },
};

export default implementation;
