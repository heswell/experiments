import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import {terser} from 'rollup-plugin-terser';

const isProd = process.env.BUILD === 'production';

export default [{
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        resolve({
            preferBuiltins: false
        }),
        commonjs(),
        filesize(),
        ...(isProd ? [terser()] : [])
    ]
}, /* Just for Jest */{
    input: 'index.jest.js',
    output: {
        file: 'tests/dist/index.js',
        format: 'cjs'
    },
    plugins: [
        resolve(),
        commonjs()
    ]
}];
