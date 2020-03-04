const path = require('path');
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const localPackages = [
  'data',
  'data-remote',
  'ingrid',
  'ingrid-extras',
  'inlay',
  'inlay-extras',
  'ui-controls',
  'utils'
]

module.exports = (_, { mode = 'development' }) => {
  const production = mode === 'production';
  console.log(`mode production ${production}`)
  const entryPoint = production
    ? 'src/main.js'
    : 'src/index.js';

  // Note: in 'dev' mode, we don't explicitly import library css, so we assume all 
  // libraries will implement package.dev.json, pointing module to 'src'. That way
  // css will be included in build.
  // Q what if we only want to build certain libraries from source ?
  const descriptionFiles = production
    ? ['package.json']
    : ['package.dev.json', 'package.json'];

  const includeSrc = [path.join(__dirname, 'src')];

  const includeFiles = production
    ? includeSrc
    : includeSrc.concat(localPackages.map(pck => fs.realpathSync(`${__dirname}/../${pck}`)))

  return ({
    node: false,
    devtool: 'cheap-module-eval-source-map',
    entry: path.join(__dirname, entryPoint),
    resolve: {
      descriptionFiles,
      extensions: ['.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: includeFiles,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/react", { modules: false }]],
              plugins: ["@babel/plugin-syntax-dynamic-import"]
            }
          }
        },
        {
          test: /\.css$/,
          // use: production ? [MiniCssExtractPlugin.loader, "css-loader"] : ["css-loader"]
          use: [MiniCssExtractPlugin.loader, "css-loader"]
        }
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html')
      }),
      new MiniCssExtractPlugin(),
      // ...(production ? [new MiniCssExtractPlugin()]: [])
      new CopyPlugin([
        { from: './public/assets/fonts/MaterialIcons-Regular.woff2', to: 'assets/fonts' },
        // {from : '../../node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff2', to: 'assets/fonts'},
        { from: '../../node_modules/@heswell/viewserver/dataTables/instruments/dataset.mjs', to: 'dataTables/instruments.js' },
        { from: '../../node_modules/@heswell/data-remote/dist/server-proxy', to: 'server-proxy' }
      ])
      // ...(production ? [new BundleAnalyzerPlugin()] : [])
    ]
  });

}