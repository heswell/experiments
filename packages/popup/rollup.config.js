import atImport from "postcss-import";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import filesize from "rollup-plugin-filesize";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";

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
    }), // needed just to resolve 'jsx'
    commonjs(),
    babel({
      babelrc: false,
      exclude: /node_modules/,
      presets: [["@babel/react", { modules: false }]],
    }),
    postcss({
      plugins: [atImport()],
      minimize: false,
      extract: true,
      sourceMap: true,
    }),
    filesize(),
    ...(isProd ? [terser()] : []),
  ],
  external: ["classnames", "react", "react-dom"],
};
