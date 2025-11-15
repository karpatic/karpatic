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
const rmlogs = true; 
// auto-generate a PWA manifest + assets using webpack.config + a header.json file that you can copy to src/ for future deploys.
// add '_projectname' to each generated asset and header.js will inject the manifest tag contingently.
const hr = require("./rsc/header.json");

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
      index: "./src/index.js",
      head: "./src/head.js",
      "service-worker": "./src/utils/service-worker.js",
    },
    output: {
      path: path.resolve("./build"),  // Writes file to this path. Not used in browser (or while in dev)
      publicPath: isDev ? "/" : "auto", // isDev ? "/" : "./", // Basepath from which all loaded assets are retrieved.
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
            compress: rmlogs ? { pure_funcs: ['console.log'], toplevel: true } : false,
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
        // inlineSource: "index.*.js$",
        // inject: "head",
      }),
      new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
      new HTMLInlineCSSWebpackPlugin({ leaveCSSFile: true }),
      !addPwa
        ? () => {}
        : new WebpackPwaManifest({
            name: hr.longName,
            short_name: hr.shortName,
            description: hr.description,
            background_color: "#ff55ff",
            crossorigin: "use-credentials", //inject:false glitches and results in the icons not being included..
            fingerprints: false,
            start_url: "/",
            display: "standalone",
            theme_color: hr.themecolor,
            dir: "rtl",
            lang: "ar",
            icons: [
              {
                src: path.resolve("rsc/images/icons/icon512.png"),
                sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
                destination: "rsc/images/icons",
                type: "image/webp",
              },
              {
                src: path.resolve("rsc/images/icons/icon512.png"),
                size: "512x512",
                destination: "rsc/images/icons",
                purpose: "maskable",
              },
            ],
          }),
      isDev
        ? () => {}
        : new HtmlMinimizerPlugin({
            minimizerOptions: { minifyJS: true },
            // test: /template_article\.html$/,
            exclude: [/tables/, /maps/, /music/],
          }),
      // isDev ? () => {} : new WebpWebpackPlugin(),
      !analyze ? () => {} : new BundleAnalyzerPlugin(),
      isDev || !compress
        ? () => {}
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
        ? () => {}
        : new CompressionPlugin({
            filename: "[path][base].gz",
            algorithm: "gzip",
            test: /\.(ico|js|css|html|svg)$/,
            compressionOptions: { level: 9 },
            threshold: 10240,
            minRatio: 0.8,
            deleteOriginalAssets: false,
          }),
      isDev
        ? () => {}
        : new CopyRootIndexPlugin({
            enabled: true,
            filename: 'index.html',
            prefix: '/build/' // adjust if you deploy under a subpath
          }),
    ],
    devServer: {
      open: true,
      static: [
        // live source tree exposed at /rsc
        { directory: path.resolve(__dirname, "src"), publicPath: "/rsc", watch: true, serveIndex: true },
        // built output exposed at /build
        { directory: path.resolve(__dirname, "build"), publicPath: "/build", watch: true, serveIndex: true },
        // repo root for index.html, CNAME, robots.txt, etc.
        { directory: path.resolve(__dirname, "."), publicPath: "/", watch: false, serveIndex: true },
      ],
      // watchFiles: ['src/**/*'],
      historyApiFallback: { disableDotRule: true },
      proxy: { "/esp_lights/": "http://localhost:8081/karpatic/esp_lights" },
    },
  };
};


class CopyRootIndexPlugin {
  constructor(opts = {}) {
    this.enabled = opts.enabled !== false;
    this.filename = opts.filename || '404.html';
    this.prefix = opts.prefix || '/build/'; // how to prefix asset paths in root copy
  }
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyRootIndexPlugin', (compilation) => {
      if (!this.enabled) return;
      const srcPath = path.join(compiler.options.output.path, this.filename);
      if (!fs.existsSync(srcPath)) return;
      let html = fs.readFileSync(srcPath, 'utf-8');

      // Only rewrite when we create the root copy (so original stays untouched)
      // Prefix relative (no leading /, http, https, data:, mailto:, #) asset refs.
      const matches = [];
      html = html.replace(
        /(src|href)=["'](?!\/|https?:|data:|mailto:|#)([^"']+)["']/g,
        (m, attr, asset) => {
          const before = m;
          const after = `${attr}="${this.prefix}${asset}"`;
          matches.push({ before, after });
          return after;
        }
      );
      matches.forEach(({ before, after }) => {
        console.log(`\n Rewriting: ${before} -> ${after}`);
      });
 

      // Write to index.html in root
      const destPath = path.resolve(compiler.options.context, this.filename);
      fs.writeFileSync(destPath, html);
      console.log(`\nCopied ${this.filename} to project root with asset prefixes "${this.prefix}"`);

      // Edit: index.html copied to 404.html in rerendererest.js then index is prerendered in place.
      // Write to 404.html in root to serve as ERR fallback on github pages
      const dest404Path = path.resolve(compiler.options.context, '404.html');
      fs.writeFileSync(dest404Path, html);
      console.log(`\nCopied ${this.filename} to 404.html in project root`);
    });
  }
}

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
