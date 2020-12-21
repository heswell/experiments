import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import filesize from "rollup-plugin-filesize";
import visualizer from "rollup-plugin-visualizer";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { commonJsConfig } from "../../rollup/config";

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
      plugins: [],
      minimize: false,
      extract: true,
      sourceMap: true,
    }),
    filesize(),
    visualizer(),
  ],
  external: [
    "@heswell/toolkit-1.0",
    "@heswell/toolkit-2.0",
    "@heswell/utils",
    "classnames",
    "react",
    "react-dom",
    "react-jss",
  ],
};
