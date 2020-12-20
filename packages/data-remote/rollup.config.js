import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";

import { commonJsConfig } from "../../rollup/config";

export default [
  {
    input: "index.js",
    output: {
      file: "dist/index.js",
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
  {
    input: "./src/servers/viewserver/server-proxy.js",
    output: {
      file: "dist/server-proxy/viewserver.js",
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
  {
    input: "./src/servers/vuu/server-proxy.js",
    output: {
      file: "dist/server-proxy/vuu.js",
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
