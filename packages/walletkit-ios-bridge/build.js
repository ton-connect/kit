/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { build } = require('vite');

const libraries = [
    {
        entry: path.resolve(__dirname, 'src/index.ts'),
        fileName: 'walletkit-ios-bridge',
        description: 'Main WalletKit bridge for RPC communication',
    },
    {
        entry: path.resolve(__dirname, 'src/inject.ts'),
        fileName: 'inject',
        description: 'Injection code for internal browser WebView',
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
                replacement: path.resolve(__dirname, 'src/polyfills/expo-crypto.js'),
            },
            {
                find: 'react-native-fast-pbkdf2',
                replacement: path.resolve(__dirname, 'src/polyfills/pbkdf2.js'),
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
    console.log('\n🔐 Generating checksums...');
    const files = await fs.promises.readdir(buildDir);
    const checksums = {};

    for (const file of files) {
        const filePath = path.resolve(buildDir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isFile()) {
            const checksum = await generateChecksum(filePath);
            checksums[file] = checksum;
            console.log(`   ${file}: ${checksum}`);
        }
    }

    const checksumFile = path.resolve(buildDir, 'checksums.json');
    await fs.promises.writeFile(checksumFile, JSON.stringify(checksums, null, 2));
    console.log(`\n✅ Checksums saved to ${checksumFile}`);
}

async function buildAll() {
    // Parse command line arguments
    const shouldGenerateChecksums = true;

    console.log('🏗️  Building iOS WalletKit bundles...\n');

    // Output to package dist directory
    const buildDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(buildDir)) {
        const files = await fs.promises.readdir(buildDir);
        for (const file of files) {
            const filePath = path.resolve(buildDir, file);
            const stat = await fs.promises.stat(filePath);
            if (stat.isFile()) {
                await fs.promises.unlink(filePath);
            }
        }
    } else {
        await fs.promises.mkdir(buildDir, { recursive: true });
    }

    for (let i = 0; i < libraries.length; i++) {
        const lib = libraries[i];
        console.log(`📦 Building ${lib.description}...`);
        console.log(`   Entry: ${path.relative(__dirname, lib.entry)}`);
        console.log(`   Output: ${lib.fileName}.mjs\n`);

        await build({
            ...sharedConfig,
            configFile: false,
            root: __dirname,
            build: {
                outDir: buildDir,
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

        console.log(`✅ ${lib.fileName}.mjs built successfully!\n`);
    }

    console.log('🎉 Build complete!');
    console.log(`\n📁 Output directory: ${buildDir}`);
    console.log('   - walletkit-ios-bridge.mjs (Main bridge for RPC)');
    console.log('   - inject.mjs (Internal browser injection)');

    // Generate checksums if requested
    if (shouldGenerateChecksums) {
        await generateChecksums(buildDir);
    }
}

buildAll().catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
