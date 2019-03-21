import path from 'path'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import Stylish from 'webpack-stylish'
import InlineChunkHtmlPlugin from 'react-dev-utils/InlineChunkHtmlPlugin'
import ManifestPlugin from 'webpack-manifest-plugin'
import nodeExternals from 'webpack-node-externals'

import babelConfig from './.babelrc.js'
import pkg from './package.json'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
const IS_SSR = process.env.SSR

import { exampleOutDirClient, exampleOutDirServer, exampleEntry } from './paths'

const makeBabelConfig = shouldUseModernJS => {
  const targets = shouldUseModernJS ? { esmodules: true } : { browsers: pkg.browserslist }

  return {
    babelrc: false,
    env: babelConfig.env,
    plugins: babelConfig.plugins,
    presets: [
      '@babel/react',
      [
        '@babel/env',
        {
          modules: false,
          shippedProposals: true,
          useBuiltIns: 'usage',
          loose: true,
          targets
        }
      ]
    ]
  }
}

const publicPath = '/'

const mainConfig: webpack.Configuration = {
  context: __dirname,

  mode: IS_PRODUCTION ? 'production' : IS_DEVELOPMENT ? 'development' : 'none',

  bail: IS_PRODUCTION,

  devtool: IS_PRODUCTION ? 'source-map' : 'cheap-module-source-map',

  entry: exampleEntry,

  output: {
    // path: IS_PRODUCTION ? exampleOutDirClient : undefined,
    pathinfo: IS_DEVELOPMENT,
    filename: 'static/js/[name].[hash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    publicPath,
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
  },

  optimization: {
    minimize: IS_PRODUCTION,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        },
        parallel: true,
        cache: true,
        sourceMap: true
      }),

      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          map: {
            inline: false,
            annotation: true
          }
        }
      })
    ],
    splitChunks: { chunks: 'all' },
    runtimeChunk: !IS_SSR
  },

  resolve: {
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx']
  },

  module: {
    strictExportPresence: true,
    rules: [
      { parser: { requireEnsure: false } },

      {
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]'
            }
          },

          {
            type: 'javascript/auto',
            test: /\.mjs$/,
            use: []
          },

          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  ...makeBabelConfig(true),
                  presets: babelConfig.presets.filter(p => p !== '@babel/typescript')
                }
              },

              {
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                  configFile: IS_SSR ? 'tsconfig.json' : 'tsconfig.client.json'
                }
              }
            ]
          },

          {
            test: /\.(sa|sc|c)ss$/,
            use: [IS_PRODUCTION ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader']
          },
          // "file" loader makes sure those assets get served by WebpackDevServer.
          // When you `import` an asset, you get its (virtual) filename.
          // In production, they would get copied to the `build` folder.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            loader: require.resolve('file-loader'),
            // Exclude `js` files to keep "css" loader working as it injects
            // its runtime that would otherwise be processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]'
            }
          }
          // ** STOP ** Are you adding a new loader?
          // Make sure to add the new loader(s) before the "file" loader.
        ]
      }
    ]
  },

  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin(
      Object.assign(
        {},
        {
          inject: true,
          template: path.resolve(__dirname, 'usage/index.html')
        },
        IS_PRODUCTION
          ? {
              minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true
              }
            }
          : undefined
      )
    ),

    IS_PRODUCTION && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),

    IS_DEVELOPMENT && new Stylish(),

    new CleanWebpackPlugin(),

    IS_PRODUCTION &&
      new MiniCssExtractPlugin({
        filename: IS_PRODUCTION ? './static/css/main.[contenthash:8].css' : '[id].css',
        chunkFilename: IS_PRODUCTION ? './static/css/[id].[contenthash:8].css' : '[id].css'
      }),

    IS_DEVELOPMENT && new webpack.HotModuleReplacementPlugin(),

    IS_PRODUCTION && new ManifestPlugin()
  ].filter(Boolean),

  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },

  performance: false
}

export const enum Target {
  Client,
  Server
}

export const enum Environment {
  Development,
  Production
}

function pp(obj) {
  return JSON.stringify(obj, null, 2)
}

export default (
  target = Target.Client,
  environment = Environment.Development
): webpack.Configuration => {
  if (target === Target.Client) {
    return {
      ...mainConfig,
      output: {
        ...mainConfig.output,
        path: exampleOutDirClient
      }
    }
  }

  if (target === Target.Server) {
    return {
      ...mainConfig,
      node: {
        // We want to uphold node's __filename, and __dirname.
        __console: false,
        __dirname: false,
        __filename: false
      },
      externals: [
        nodeExternals({
          whitelist: [
            IS_DEVELOPMENT ? 'webpack/hot/poll?300' : null,
            /\.(eot|woff|woff2|ttf|otf)$/,
            /\.(svg|png|jpg|jpeg|gif|ico)$/,
            /\.(mp4|mp3|ogg|swf|webp)$/,
            /\.(css|scss|sass|less)$/
          ].filter(x => x)
        })
      ],
      output: {
        publicPath,
        path: exampleOutDirServer,
        filename: 'server.js',
        libraryTarget: 'commonjs2'
      }
    }
  }

  return mainConfig
}
