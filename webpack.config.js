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
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src/client/')
    }
  },

  module: {
    rules: [
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

      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },

      {
        test: /\.css$/,
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
