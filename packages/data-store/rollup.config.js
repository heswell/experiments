import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import { terser } from "rollup-plugin-terser";
import { commonJsConfig } from "../../rollup/config";

const isProd = process.env.BUILD === "production";

export default [
  {
    input: "index.js",
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(commonJsConfig),
      ...(isProd
        ? [
            terser({
              output: {
                comments: /webpackIgnore/,
              },
            }),
          ]
        : []),
      filesize(),
    ],
    external: ["@heswell/utils"],
  },
  /* Just for Jest */ {
    input: "index.jest.js",
    output: {
      file: "tests/dist/index.js",
      format: "cjs",
    },
    plugins: [resolve(), commonjs(commonJsConfig)],
  },
];
