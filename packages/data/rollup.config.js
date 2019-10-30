import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs()
    ]
}, /* Just for Jest */{
    input: 'index.jest.js',
    output: {
        file: 'dist/index.cjs.js',
        format: 'cjs'
    },
    plugins: [
        resolve(),
        commonjs()
    ]
}];
