import resolve from 'rollup-plugin-node-resolve'

export default {
    input: 'index.mjs',
    output: {
        file: 'dist/index.mjs',
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        resolve({
            preferBuiltins: true
        })
    ]
};
