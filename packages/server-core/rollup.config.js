import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import { commonJsConfig } from "../../rollup/config";

export default {
  input: "index.js",
  output: {
    file: "dist/index.mjs",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(commonJsConfig),
    filesize(),
  ],
};
