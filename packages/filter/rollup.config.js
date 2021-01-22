import atImport from "postcss-import";
import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import postcss from "rollup-plugin-postcss";

import filesize from "rollup-plugin-filesize";
// import { terser } from "rollup-plugin-terser";

const isProd = process.env.BUILD === "production";

export default {
  input: "index.js",
  output: {
    dir: "dist",
    // file: 'dist/index.js',
    format: "cjs",
    sourcemap: true,
  },
  perf: false,
  preserveSymlinks: true,
  plugins: [
    resolve({
      extensions: [".js", ".jsx"],
    }),
    commonjs(),
    babel({
      babelrc: false,
      exclude: "node_modules/**",
      presets: [["@babel/react", { modules: false }]],
      plugins: [
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

    //   ...(isProd ? [terser()] : []),
    filesize(),
  ],
  external: [
    "@heswell/data-source",
    "@heswell/layout",
    "@heswell/utils",
    "classnames",
    "react",
    "react-dom",
  ],
};
