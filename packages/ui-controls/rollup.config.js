import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import {terser} from 'rollup-plugin-terser';
import atImport from 'postcss-import';

const isProd = process.env.BUILD === 'production';

export default {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        resolve({
            extensions: ['.js', '.jsx']
        }), // needed just to resolve 'jsx'
        babel({
            babelrc: false,
            exclude: 'node_modules/**',
            "presets": [["@babel/react", {modules: false}]]
        }),
        postcss({
            plugins: [
                atImport()
            ],
            minimize: false,
            extract: true,
            sourceMap: true
          }),
          filesize(),
          ...(isProd ? [terser()] : [])
    ],
    "external": [
        "classnames",
        "react",
        "react-dom"
    ]

};
