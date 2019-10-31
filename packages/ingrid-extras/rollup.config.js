import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import atImport from 'postcss-import'
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';

export default {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs(),
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
          }),
          filesize()
    ],
    "external": [
        "@heswell/data",
        "@heswell/inlay",
        "@heswell/ingrid",
        "@heswell/ui-controls",
        "@heswell/utils",
        "dygraphs",
        "react",
        "react-dom",
        "react-motion"
    ]
};
