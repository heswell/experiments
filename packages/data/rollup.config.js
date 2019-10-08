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
}/*, {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs()
    ]
}*/];
