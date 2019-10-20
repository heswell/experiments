import nodeResolve from 'rollup-plugin-node-resolve'
import copy from 'rollup-plugin-copy'

export default [{
    input: './src/services/DataTableService.mjs',
    output: {
        file: 'dist/DataTableService.mjs',
        format: 'es',
        sourcemap: false
    },
    external: ['url','path'],
    plugins: [
        nodeResolve({
            preferBuiltins: true
        }),
        copy({
            targets: [
                {src: 'dataTables', dest: 'dist'}
            ]
        })
    ]

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
    ]
}];
