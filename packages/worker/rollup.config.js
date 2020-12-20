import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import { commonJsConfig } from "../../rollup/config";

export default [
  {
    input: "./src/worker-local-model.js",
    output: {
      file: "dist/worker-local-model.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      resolve({
        preferBuiltins: false,
      }),
      commonjs(commonJsConfig),
      filesize(),
    ],
  },
];
