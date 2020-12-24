import atImport from "postcss-import";
import babel from "@rollup/plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import postcss from "rollup-plugin-postcss";
import resolve from "rollup-plugin-node-resolve";
import visualizer from "rollup-plugin-visualizer";
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
      plugins: [atImport()],
      minimize: false,
      extract: true,
      sourceMap: true,
    }),
    filesize(),
    visualizer(),
  ],
  external: [
    "@heswell/toolkit-2.0",
    "@heswell/utils",
    "classnames",
    "react",
    "react-dom",
    "react-jss",
  ],
};
