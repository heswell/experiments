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
        input: './src/servers/viewserver/server-proxy.js',
        output: {
            file: 'dist/server-proxy/viewserver.js',
            format: 'es',
            sourcemap: true
        }
    },
    {
        input: './src/servers/vuu/server-proxy.js',
        output: {
            file: 'dist/server-proxy/vuu.js',
            format: 'es',
            sourcemap: true
        }
    },
];
