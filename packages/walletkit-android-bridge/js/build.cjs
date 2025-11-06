/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');

const { build } = require('vite');

const libraries = [
    {
        entry: path.resolve(__dirname, 'src/index.ts'),
        fileName: 'walletkit-android-bridge',
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
};

async function buildAll() {
    console.log('🏗️  Building Android WalletKit bundles...\n');

    // Output to package dist directory
    const buildDir = path.resolve(__dirname, '../dist');
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
    console.log('   - walletkit-android-bridge.mjs (Main bridge for RPC)');
    console.log('   - inject.mjs (Internal browser injection)');
    console.log('\n💡 Bundles will be copied to Android SDK assets by Gradle task syncWalletKitWebViewAssets');
}

buildAll().catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
});
