import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
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
    perf: false,
    preserveSymlinks: true,
    plugins: [
        resolve(),
        commonjs(),
        babel({
            babelrc: false,
            exclude: 'node_modules/**',
            "presets": [["@babel/react", {modules: false}]]
        }),
        postcss({
            plugins: [],
            minimize: false,
            extract: true,
            sourceMap: true
          }),
          ...(isProd ? [terser()] : []),
          filesize()
    ],
    "external": [
        "@heswell/data",
        "@heswell/ingrid-extras",
        "@heswell/ui-controls",
        "@heswell/utils",
        "classnames",
        "react",
        "react-dom"
    ]
}, /* Just for Jest */{
    input: 'index.jest.js',
    output: {
        file: 'tests/dist/index.js',
        format: 'cjs'
    },
    plugins: [
        resolve(),
        commonjs(),
        babel({
            babelrc: false,
            exclude: 'node_modules/**',
            "presets": [["@babel/react", {modules: false}]]
        }),
        postcss({
            plugins: [],
            minimize: false,
            extract: true,
            sourceMap: true
          })
    ],
    "external": [
        "@heswell/ingrid-extras",
        "@heswell/ui-controls",
        "classnames",
        "react",
        "react-dom"
    ]

}];
