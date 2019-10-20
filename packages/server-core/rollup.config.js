import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: 'index.js',
    output: {
        file: 'dist/index.mjs',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        resolve({
            preferBuiltins: true
        }),
        commonjs()
    ]
};
