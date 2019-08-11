import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import atImport from 'postcss-import'
// import cssnano from 'cssnano'

export default {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        postcss({
            plugins: [
                atImport(),
                // cssnano()
            ],
            minimize: false,
            extract: true,
            sourceMap: true
          })
    ]
};
