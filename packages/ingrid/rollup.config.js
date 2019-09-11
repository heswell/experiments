import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sizes from 'rollup-plugin-sizes';

export default {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
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
          sizes()
    ],
    "external": [
        "@heswell/data",
        "@heswell/ingrid-extras",
        "@heswell/ui-controls",
        "@heswell/utils",
        "classnames",
        "react",
        "react-dom",
        "react-motion"
    ]
};
