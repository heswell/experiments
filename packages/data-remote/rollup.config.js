export default [
    {
        input: 'index.js',
        output: {
            file: 'dist/index.js',
            format: 'es',
            sourcemap: true
        }
    },
    {
        input: './src/viewserver-proxy.js',
        output: {
            file: 'dist/server-proxy/viewserver.js',
            format: 'es',
            sourcemap: true
        }
    },
    {
        input: './src/vuu-proxy.js',
        output: {
            file: 'dist/server-proxy/vuu.js',
            format: 'es',
            sourcemap: true
        }
    },
];
