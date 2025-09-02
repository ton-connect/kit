import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile'
// https://vite.dev/config/
export default defineConfig({
    plugins: [viteSingleFile()],
    build: {
        assetsDir: '',
        outDir: 'IOSKitDemo/IOSKitDemo/dist-js',
        assetsInlineLimit: () => true,
        rollupOptions: {
            output: {
                // Ensure all JS is inlined into the HTML
                inlineDynamicImports: true,
                // Generate a single chunk
                manualChunks: undefined,
            }
        },
        // Inline all assets including JS and CSS
        // assetsInlineLimit: 100000000, // Large number to inline everything
        // Don't generate separate CSS files
        cssCodeSplit: false
    },
    // Ensure TypeScript files are processed
    esbuild: {
        target: 'es2015'
    }
});
