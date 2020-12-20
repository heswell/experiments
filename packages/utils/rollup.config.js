import babel from "@rollup/plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import { terser } from "rollup-plugin-terser";

import react from "react";
import reactDom from "react-dom";

const commonConfig = {
  include: "node_modules/**",
  namedExports: {
    react: Object.keys(react),
    "react-dom": Object.keys(reactDom),
  },
};

const isProd = process.env.BUILD === "production";

export default [
  {
    input: "index.js",
    output: {
      file: "dist/index.js",
      // format: 'cjs',
      format: "es",
      sourcemap: true,
    },
    plugins: [
      resolve({
        extensions: [".js", ".jsx"],
      }),
      commonjs(commonConfig),
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
      filesize(),
      ...(isProd ? [terser()] : []),
    ],
    external: ["react", "react-dom"],
  },
];
