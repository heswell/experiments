import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';

export default [{
    input: 'index.js',
    output: {
        file: 'dist/index.es.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        resolve({
            preferBuiltins: false
        }),
        commonjs()
    ]
}, {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        resolve({
            preferBuiltins: false
        }),
        commonjs(),
        filesize()
    ]
}];
