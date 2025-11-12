/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

/**
 * Generate SHA-256 checksum for a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} Hex string of the checksum
 */
async function generateChecksum(filePath) {
    const fileBuffer = await fs.promises.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Generate checksums for all files in the build directory
 * @param {string} buildDir - Path to the build directory
 */
async function generateChecksums(buildDir) {
    console.log('\nGenerating checksums...');
    const files = await fs.promises.readdir(buildDir);
    const checksums = {};

    for (const file of files) {
        const filePath = path.resolve(buildDir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isFile()) {
            const checksum = await generateChecksum(filePath);
            checksums[file] = checksum;
            console.log(`  ${file}: ${checksum}`);
        }
    }

    const checksumFile = path.resolve(buildDir, 'checksums.json');
    await fs.promises.writeFile(checksumFile, JSON.stringify(checksums, null, 2));
    console.log(`\nChecksums saved to ${checksumFile}`);
}

async function buildAll() {
    // Parse command line arguments
    const shouldGenerateChecksums = true;

    // cleanup output directory (only files inside, dont delete directory itself)
    const buildDir = path.resolve(__dirname, 'build');
    if (!fs.existsSync(buildDir)) {
        await fs.promises.mkdir(buildDir, { recursive: true });
    }

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

    // Generate checksums if requested
    if (shouldGenerateChecksums) {
        await generateChecksums(buildDir);
    }
}

buildAll().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});
