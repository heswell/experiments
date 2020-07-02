import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

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
        },
        plugins: [
            resolve({
                preferBuiltins: false
            }),
            commonjs()
        ]
    },
    {
        input: './src/servers/vuu/server-proxy.js',
        output: {
            file: 'dist/server-proxy/vuu.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [
            resolve({
                preferBuiltins: false
            }),
            commonjs()
        ]
    },
];
