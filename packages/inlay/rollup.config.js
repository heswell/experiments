import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import filesize from 'rollup-plugin-filesize';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        // if we include these (to pull in d3-selection and d3-transition) everything is imported
        // with them and they complain about JSX in our local files
        // TODO use Pika for d3-selection and d3-transition
        // resolve(),
        // commonjs(),
        babel({
            exclude: 'node_modules/**',
            "presets": [["@babel/react", {modules: false}]]
        }),
        postcss({
            plugins: [],
            minimize: false,
            extract: true,
            sourceMap: true
          }),
          filesize()    
    ],
    "external": [
        "@heswell/ui-controls",
        "@heswell/utils",
        "classnames",
        "react",
        "react-dom",
        "stretch-layout"
    ]

}, /* Just for Jest */ /*{
    input: 'index.jest.js',
    output: {
        file: 'tests/dist/index.js',
        format: 'cjs'
    },
    plugins: [
        resolve(),
        commonjs()
    ]
}*/];
