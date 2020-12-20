import babel from "rollup-plugin-babel";
import postcss from "rollup-plugin-postcss";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import filesize from "rollup-plugin-filesize";
import { terser } from "rollup-plugin-terser";
import atImport from "postcss-import";

const isProd = process.env.BUILD === "production";

// only until we get rid id @material-ui
const commonjsOptions = {
  // left-hand side can be an absolute path, a path
  // relative to the current directory, or the name
  // of a module in node_modules
  include: [
    /node_modules\/prop-types/,
    /node_modules\/react-is/,
    /node_modules\/react-display-name/,
    /node_modules\/hoist-non-react-statics/,
    /node_modules\/escape-string-regexp/,
    /node_modules\/warning/,
    /node_modules\/react-fast-compare/,
  ],
  namedExports: {
    "../../node_modules/react-is/index.js": [
      "isElement",
      "isFragment",
      "isValidElementType",
      "ForwardRef",
      "Memo",
    ],
  },
};
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
    commonjs(commonjsOptions),
    babel({
      babelrc: false,
      exclude: "node_modules/**",
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
