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
        // format: 'cjs',
        sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs(),
        ...(isProd ? [terser({
            mangle: {
                reserved: ['workerCode']
            },
            output: {
                comments: /webpackIgnore/
            }
        })] : []),
        filesize()
    ],
    external: [
        "@heswell/utils"
    ]

}];
