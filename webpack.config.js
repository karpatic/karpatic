const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const postcssPresetEnv = require("postcss-preset-env");
const postcss = require("postcss");
const webpack = require("webpack");
const cssnano = require("cssnano"); // or: https://webpack.js.org/plugins/css-minimizer-webpack-plugin/
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin-patched");
const HTMLInlineCSSWebpackPlugin =
  require("html-inline-css-webpack-plugin").default;
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

// auto-generate a PWA manifest + assets using webpack.config + a header.json file that you can copy to src/ for future deploys.
// add '_projectname' to each generated asset and header.js will inject the manifest tag contingently.
const hr = require("./src/client/header.json");

const WebpackPwaManifest = require("webpack-pwa-manifest");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const fs = require("fs");
const sharp = require("sharp");

const CompressionPlugin = require("compression-webpack-plugin");
// https://webpack.js.org/configuration/dev-server/
// https://github.com/webpack/webpack-dev-server
// https://github.com/orgs/community/discussions/21655
// - no point in using the compression webpack plugin since as github does it anyways
const compress = false;
const analyze = false;

const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = (env, args) => {
  // process.env is different from env here
  const isDev = args.mode === "development";
  const addPwa = isDev ? false : false; // No need to inject PWA
  let template = `
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
    <head id="head"></head>
    <body></body>
  </html>`;
  return {
    cache: false,
    entry: {
      index: "./src/client/index.js",
      head: "./src/client/head.js",
      "service-worker": "./src/client/utils/service-worker.js",
    },
    output: {
      path: path.resolve("./docs"),
      publicPath: "/",
      filename: (pathData) => {
        // [name] defers to id when it doesn't exist.
        // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', pathData)
        return pathData.runtime == "service-worker"
          ? "service-worker.js"
          : "[runtime].[id].[hash].js";
      },
      chunkFilename: "chunk.[name].[chunkhash].js",
      globalObject: "self",
      clean: true,
    },
    optimization: {
      minimize: isDev ? false : true,
      minimizer: [
        new TerserPlugin({
          // config default parser
          terserOptions: {
            parse: { html5_comments: false },
            // compress: { pure_funcs: ['console.log'], toplevel: true },
            sourceMap: { url: "inline" },
            keep_classnames: true,
            keep_fnames: true,
            nameCache: false, // when set to true it helps speed things up but can deliver outdated cache results
          },
        }),
        new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.imageminMinify,
            options: {
              plugins: [
                ["imagemin-gifsicle", { progressive: true }],
                ["imagemin-mozjpeg", { progressive: true }],
                ["imagemin-pngquant", { progressive: true }],
                [
                  "imagemin-svgo",
                  {
                    plugins: [
                      {
                        name: "preset-default",
                        params: {
                          overrides: {
                            removeViewBox: false,
                            addAttributesToSVGElement: {
                              params: {
                                attributes: [
                                  { xmlns: "http://www.w3.org/2000/svg" },
                                ],
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              ],
            },
          },
        }),
      ],
      splitChunks: { chunks: "all" },
    },
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: {
            loader: "worker-loader",
            options: { inline: true, name: "worker.[hash].js" },
          },
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /(node_modules|index|router|sitemap)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
        {
          test: /\.(sc|c)ss$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [
                    postcssPresetEnv(),
                    cssnano(),
                    // { postcssPlugin: "log-modules", Once(root) {root.walkRules((rule) => {console.log("Testing module: ", rule.source.input.file); });}, },
                  ],
                },
              },
            },
            // according to the docs, sass-loader should be at the bottom, which
            // loads it first to avoid prefixes in your sourcemaps and other issues.
            "sass-loader",
          ],
        },
        {
          test: /\.(csv|tsv)$/,
          use: ["csv-loader"],
        },
        {
          test: /\.(png|jpg|gif|ico|svg)$/i,
          type: "asset/resource",
          generator: {
            filename: "images/[name][ext]",
          },
        },
        {
          test: /\.json$/,
          type: "asset/resource",
          generator: {
            filename: "[name].json",
          },
        },
        {
          test: /\.html$/,
          type: "asset/source",
          generator: {
            filename: "[name][ext]",
          },
        },
      ],
    },

    plugins: [
      new webpack.DefinePlugin({
        CACHEBUST: JSON.stringify(Math.floor(Math.random() * 100000000)),
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[name].[id].css",
      }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        chunks: ["index", "head"],
        // excludeChunks: ["???"],
        templateContent: template,
        inlineSource: "index.*.js$",
        inject: "head",
      }),
      new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
      new HTMLInlineCSSWebpackPlugin({ leaveCSSFile: true }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "./robots.txt", to: "robots.txt", toType: "file" },
          { from: "./sitemap.txt", to: "sitemap.txt", toType: "file" },
          { from: "./CNAME", to: "CNAME", toType: "file" },
          // { from: './src/404.html', to: '404.html', toType: 'file' },
          {
            from: "./src/client/utils/service-worker.js",
            to: "utils/service-worker.js",
            toType: "file",
          },
          {
            from: "./src/client/templates/article.html",
            to: "templates/article.html",
            toType: "file",
          },
          {
            from: "./src/client/templates/article_lazy.js",
            to: "templates/article_lazy.js",
            toType: "file",
          },
          { from: "./src/ipynb", to: "./ipynb", toType: "dir" }, 
          { from: "./src/music", to: "./music", toType: "dir" },
          { from: "./src/client/cdn", to: "./cdn", toType: "dir" },
          { from: "./src/client/posts", to: "./posts", toType: "dir" },
          { from: "./src/client/images", to: "./images", toType: "dir" },
          { from: "./src/client/utils", to: "./utils", toType: "dir" },
          { from: "./src/client/audio", to: "./audio", toType: "dir" },
          {
            from: "src/client/templates/*.css",
            to: "./templates/[name].css",
            transform: (basePath, path) => {
              console.log(
                "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Transforming: ",
                path
              );
              return postcss([postcssPresetEnv(), cssnano()])
                .process(basePath, { from: path })
                .then((result) => result.css);
            },
          },
        ],
      }),
      !addPwa
        ? () => { }
        : new WebpackPwaManifest({
          name: hr.longName,
          short_name: hr.shortName,
          description: hr.description,
          background_color: "#ff55ff",
          crossorigin: "use-credentials", //inject:false glitches and results in the icons not being included..
          fingerprints: false,
          start_url: "./",
          display: "standalone",
          theme_color: hr.themecolor,
          dir: "rtl",
          lang: "ar",
          icons: [
            {
              src: path.resolve("src/images/icon512.png"),
              sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
              destination: "docs/images",
              type: "image/webp",
            },
            {
              src: path.resolve("src/images/icon512.png"),
              size: "512x512",
              destination: "docs/images",
              purpose: "maskable",
            },
          ],
        }),
      isDev
        ? () => { }
        : new HtmlMinimizerPlugin({
          minimizerOptions: { minifyJS: true },
          // test: /template_article\.html$/,
          exclude: [/tables/, /maps/, /music/],
        }),
      isDev ? () => { } : new WebpWebpackPlugin(),
      !analyze ? () => { } : new BundleAnalyzerPlugin(),
      isDev || !compress
        ? () => { }
        : new CompressionPlugin({
          filename: "[path][base].br",
          algorithm: "brotliCompress",
          test: /\.(ico|js|css|html|svg)$/,
          compressionOptions: { level: 11 },
          threshold: 10240,
          minRatio: 0.8,
          deleteOriginalAssets: false,
        }),
      isDev || !compress
        ? () => { }
        : new CompressionPlugin({
          filename: "[path][base].gz",
          algorithm: "gzip",
          test: /\.(ico|js|css|html|svg)$/,
          compressionOptions: { level: 9 },
          threshold: 10240,
          minRatio: 0.8,
          deleteOriginalAssets: false,
        }),
    ],
    devServer: {
      open: true,
      static: {
        directory: "src",
        watch: true,
        serveIndex: true,
      },
      // watchFiles: ['src/**/*'],
      historyApiFallback: { disableDotRule: true },
      proxy: { "/esp_lights/": "http://localhost:8081/karpatic/esp_lights" },
    },
  };
};

// Converts images in output to webp
class WebpWebpackPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("WebpWebpackPlugin", (compilation) => {
      const outputFolder = path.resolve(compiler.options.output.path, "images");
      fs.readdir(outputFolder, (err, files) => {
        if (err) {
          console.error("Error reading output folder:", err);
          return;
        }
        files.forEach((file) => {
          const inputPath = path.join(outputFolder, file);
          if (path.extname(inputPath).toLowerCase() === ".png") {
            const outputPath = path.join(
              outputFolder,
              `${path.parse(inputPath).name}.webp`
            );
            sharp(inputPath)
              .webp()
              .toFile(outputPath)
              .then(() => {
                console.log(`Converted ${inputPath} to ${outputPath}`);
              })
              .catch((err) => {
                console.error(`Error converting ${inputPath}:`, err);
              });
          }
        });
      });
    });
  }
}
