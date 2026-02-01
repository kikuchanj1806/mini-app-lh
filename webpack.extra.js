// webpack.extra.js
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { join } = require('path');

const imgSrc = join(__dirname, 'src/assets/img');

module.exports = {
  output: {
    libraryTarget: 'umd',
    globalObject: 'this',
    filename: '[name].js',
  },
  experiments: {
    outputModule: false,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: imgSrc,       // src/assets/img
          to: 'assets/img',   // dist/.../assets/img
          noErrorOnMissing: true
        }
      ]
    })
  ]
};
