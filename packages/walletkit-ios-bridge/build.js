/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');

const { build } = require('vite');

const libraries = [
    {
        entry: path.resolve(__dirname, 'js/src/index.ts'),
        fileName: 'walletkit-ios-bridge',
    },
    {
        entry: path.resolve(__dirname, 'js/src/inject.ts'),
        fileName: 'inject',
    },
];

const sharedConfig = {
    esbuild: {
        target: 'es2015',
    },
    resolve: {
        alias: [
            {
                find: '@ton/crypto-primitives',
                replacement: require.resolve('@ton/crypto-primitives/dist/native.js'),
            },
            {
                find: 'expo-crypto',
                replacement: path.resolve(__dirname, 'js/empty.js'),
            },
            {
                find: 'react-native-fast-pbkdf2',
                replacement: path.resolve(__dirname, 'js/pbkdf2.js'),
            },
        ],
    },
};

async function buildAll() {
    // cleanup output directory (only files inside, dont delete directory itself)
    const buildDir = path.resolve(__dirname, 'build');
    const files = await fs.promises.readdir(buildDir);
    for (const file of files) {
        await fs.promises.unlink(path.resolve(buildDir, file));
    }

    for (let i = 0; i < libraries.length; i++) {
        const lib = libraries[i];
        console.log(`Building ${lib.fileName}...`);

        await build({
            ...sharedConfig,
            build: {
                outDir: './build',
                lib: {
                    entry: lib.entry,
                    name: lib.fileName,
                    formats: ['es'],
                    fileName: (format) => `${lib.fileName}.${format === 'es' ? 'mjs' : 'js'}`,
                },
                assetsDir: '',
                assetsInlineLimit: () => true,
                rollupOptions: {
                    output: {
                        inlineDynamicImports: true,
                        manualChunks: undefined,
                    },
                },
                cssCodeSplit: false,
                minify: false,
                sourcemap: true,
                emptyOutDir: false,
            },
        });
    }

    console.log('Build complete!');
}

buildAll().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});
