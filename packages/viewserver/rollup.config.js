import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy'

export default [{
    input: './src/services/DataTableService.mjs',
    output: {
        file: 'dist/DataTableService.mjs',
        format: 'es',
        sourcemap: false
    },
    plugins: [
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs(),
        copy({
            targets: [
                {src: 'dataTables', dest: 'dist'}
            ]
        })
    ],
    external: ['url','path']

},{
    input: './src/index.js',
    output: {
        file: 'dist/index.mjs',
        format: 'es',
        sourcemap: false
    },
    plugins: [
        nodeResolve({
            preferBuiltins: true
        })
    ],
    external: ['url','path', 'fs']
}];
