import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';

export default [
    {
        input: './src/worker-local-model.js',
        output: {
            file: 'dist/worker-local-model.js',
            format: 'es',
            sourcemap: true
        },
        plugins: [
            resolve({
                preferBuiltins: false
            }),
            commonjs(),
            filesize()
        ]
    },
];
