const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  entry: path.resolve(__dirname, 'usage/index.tsx'),
  mode: 'development',
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'build'),
    filename: 'main.js'
  },

  devServer: {
    compress: true,
    contentBase: path.resolve(__dirname, 'build'),
    historyApiFallback: true
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src/client/'),
      packages: path.resolve(__dirname, 'src/packages/'),
      react: path.resolve(__dirname, 'vendor/react'),
      scheduler: path.resolve(__dirname, 'vendor/scheduler'),
      'react-dom': path.resolve(__dirname, 'vendor/react-dom'),
      'react-cache': path.resolve(__dirname, 'vendor/react-cache'),
      router: path.resolve(__dirname, 'dist/index.js')
    }
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.(ts|tsx)?$/,
        include: path.resolve(__dirname, 'usage'),
        exclude: /node_modules/,
        use: [{ loader: 'awesome-typescript-loader', options: { transpileOnly: true } }]
      },

      {
        test: /\.(js,mjs)$/,
        use: 'babel-loader'
      },

      // All output '.js' files will have any sourcemaps re-processed by 'sourceyarn -map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },

      {
        test: /\.(sa|sc|c)ss$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(['build']),
    new HtmlWebpackPlugin({
      template: './usage/index.html'
    })
  ],
  node: {
    fs: 'empty',
    net: 'empty'
  }
}
