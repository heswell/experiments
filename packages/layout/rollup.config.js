import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import filesize from 'rollup-plugin-filesize';
import visualizer from 'rollup-plugin-visualizer'

export default [{
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        babel({
            babelrc: false,
            exclude: 'node_modules/**',
            "presets": [["@babel/react", {modules: false}]],
            "plugins": [
                "@babel/plugin-syntax-dynamic-import",
                "@babel/plugin-proposal-optional-chaining",
                "@babel/plugin-proposal-nullish-coalescing-operator"
            ]
        }),
        postcss({
            plugins: [],
            minimize: false,
            extract: true,
            sourceMap: true
          }),
          filesize(),
          visualizer()  
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
