import nodeResolve from 'rollup-plugin-node-resolve'

export default [{
    input: './src/server.mjs',
    output: {
        file: 'dist/viewserver.js',
        format: 'cjs',
        sourcemap: false
    },
    external: ['url','http','crypto','path','fs'],
    plugins: [
        nodeResolve({
            jsnext: true,
            preferBuiltins: true
        })
    ]
}, {
    input: './src/@heswell/viewserver/services/DataTableService.mjs',
    output: {
        file: 'dist/DataTableService.js',
        format: 'cjs',
        sourcemap: false,
        exports: 'named'
    },
    external: ['url','path'],
    plugins: [
        nodeResolve({
            jsnext: true,
            preferBuiltins: true
        })
    ]

}];
