export default [{
    input: 'index.js',
    output: {
        file: 'dist/index.es.js',
        format: 'es',
        sourcemap: true
    }
}, {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
    }
}];
