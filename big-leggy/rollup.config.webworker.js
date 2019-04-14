// we need a transpiling build just for jest
// import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve'
// import alias from 'rollup-plugin-alias';
import replace from 'rollup-plugin-replace'

export default [{
    // this is a client-hosted simulation of a web-worker
    input: './src/@heswell/remote-data/client-hosted/web-worker.js',
    output: {
        file: 'public/web-worker.js',
        format: 'esm',
        sourcemap: true
    },
    plugins: [
        nodeResolve({
            jsnext: true
        }),
        replace({
            'process.env.WORKER_MODULE': JSON.stringify('/web-worker.js'),
            'process.env.SERVER_MODULE': JSON.stringify('/viewserver.js'),
            'process.env.TRANSPORT': JSON.stringify('/websocket.js')
        })
    ]
},{
    input: './src/@heswell/remote-data/worker-hosted/servers/viewserver.mjs',
    output: {
        file: 'public/viewserver.js',
        format: 'esm'
    }
},{
    input: './src/@heswell/remote-data/worker-hosted/transports/websocket.js',
    output: {
        file: 'public/websocket.js',
        format: 'esm'
    },
    // plugins: [alias({
    //     '@heswell/data': '././src/data'
    //   })],    
}];
