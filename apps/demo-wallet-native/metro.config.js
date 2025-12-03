// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    assert: require.resolve('empty-module'), // assert can be polyfilled here if needed
    http: require.resolve('empty-module'), // stream-http can be polyfilled here if needed
    https: require.resolve('empty-module'), // https-browserify can be polyfilled here if needed
    os: require.resolve('empty-module'), // os-browserify can be polyfilled here if needed
    url: require.resolve('react-native-url-polyfill'), // url can be polyfilled here if needed
    zlib: require.resolve('empty-module'), // browserify-zlib can be polyfilled here if needed
    path: require.resolve('empty-module'),
    crypto: require.resolve('react-native-quick-crypto'),
    stream: require.resolve('readable-stream'),
    buffer: require.resolve('@craftzdog/react-native-buffer'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@ton/crypto-primitives') {
        return {
            filePath: require.resolve('@ton/crypto-primitives/dist/node.js'),
            type: 'sourceFile',
        };
    }

    if (moduleName === 'eventsource' || moduleName.startsWith('eventsource/')) {
        return {
            filePath: require.resolve(__dirname, 'lib/polyfills/eventsource.js'),
            type: 'sourceFile',
        };
    }

    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
