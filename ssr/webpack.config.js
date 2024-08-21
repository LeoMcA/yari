import { fileURLToPath } from "node:url";
import nodeExternals from "webpack-node-externals";
import webpack from "webpack";
import crypto from "node:crypto";

class GenerateCSPHash {
  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap("GenerateCSPHash", (compilation) => {
      compilation.hooks.succeedModule.tap("GenerateCSPHash", (module) => {
        const fileName = module.resource;
        // console.log(fileName);
        if (fileName?.endsWith("?inline")) {
          const source = module.originalSource().source();
          const algo = "sha256";
          const hash = crypto.createHash(algo).update(source).digest("base64");
          console.log(`CSP hash for ${fileName}: '${algo}-${hash}'`);
        }
      });
    });
  }
}

const config = {
  context: fileURLToPath(new URL(".", import.meta.url)),
  entry: "./index.ts",
  output: {
    path: fileURLToPath(new URL("dist", import.meta.url)),
    filename: "[name].js",
    sourceMapFilename: "[name].js.map",
    library: { type: "module" },
    chunkFormat: "module",
  },
  target: "node",
  node: false,
  // See all options here:
  // https://webpack.js.org/configuration/stats/
  stats: "errors-warnings",
  resolve: {
    modules: ["node_modules", "src"],
    extensions: ["*", ".js", ".json", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            resourceQuery: /inline/,
            type: "asset/source",
            rules: [
              {
                test: /\.js$/,
                use: ["terser-loader"],
              },
            ],
          },
          {
            rules: [
              {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                  {
                    loader: "ts-loader",
                    options: {
                      transpileOnly: true,
                    },
                  },
                ],
              },
              {
                test: /\.svg$/,
                use: [
                  {
                    loader: "@svgr/webpack",
                    options: {
                      prettier: false,
                      svgo: false,
                      svgoConfig: {
                        plugins: [{ removeViewBox: false }],
                      },
                      titleProp: true,
                      ref: true,
                    },
                  },
                  {
                    loader: "file-loader",
                    options: {
                      emitFile: false,
                      publicPath: "/",
                      name: "static/media/[name].[hash].[ext]",
                    },
                  },
                ],
                issuer: {
                  and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
                },
              },
              {
                test: [/\.avif$/, /\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                type: "asset",
                parser: {
                  dataUrlCondition: {
                    maxSize: 0,
                  },
                },
                generator: {
                  emit: false,
                  publicPath: "/",
                  filename: "static/media/[name].[hash][ext]",
                },
              },
              { test: /\.(css|scss)$/, loader: "ignore-loader" },
            ],
          },
        ],
      },
    ],
  },
  externals: nodeExternals(),
  devtool: "source-map",
  plugins: [
    // This makes is so that there is only one `ssr/dist/main.js` (and
    // `ssr/dis/main.js.map`) file. There's no point in code splitting the
    // code that is run by Node. Code splitting is something that we do to benefit
    // users who consume our code through a browser.
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new GenerateCSPHash(),
  ],
  experiments: {
    outputModule: true,
  },
};

export default config;
