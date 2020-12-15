import babel from "@rollup/plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import { terser } from "rollup-plugin-terser";

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
      commonjs(),
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
  /* Just for Jest */ {
    input: "index.jest.js",
    output: {
      file: "tests/dist/index.js",
      format: "cjs",
    },
    plugins: [resolve(), commonjs()],
  },
];
