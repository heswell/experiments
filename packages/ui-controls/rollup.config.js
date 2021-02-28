import babel from "rollup-plugin-babel";
import postcss from "rollup-plugin-postcss";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import filesize from "rollup-plugin-filesize";
import visualizer from "rollup-plugin-visualizer";
import { terser } from "rollup-plugin-terser";
import atImport from "postcss-import";
import { commonJsConfig } from "../../rollup/config";

const isProd = process.env.BUILD === "production";

export default {
  input: "index.js",
  output: {
    file: "dist/index.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    resolve({
      extensions: [".js", ".jsx"],
    }),
    commonjs(commonJsConfig),
    babel({
      babelrc: false,
      exclude: "node_modules/**",
      presets: [["@babel/react", { modules: false }]],
      plugins: [
        "@babel/plugin-syntax-dynamic-import",
        "@babel/plugin-proposal-optional-chaining",
        "@babel/plugin-proposal-nullish-coalescing-operator",
      ],
    }),
    postcss({
      plugins: [atImport()],
      minimize: false,
      extract: false,
      sourceMap: true,
    }),
    filesize(),
    visualizer(),
    ...(isProd ? [terser()] : []),
  ],
  external: ["classnames", "react", "react-dom"],
};
