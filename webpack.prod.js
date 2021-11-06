const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const buildPath = path.resolve(__dirname, "dist");

module.exports = {
  entry: {
    index: "./src/script.js",
  },

  output: {
    filename: "[name].[chunkhash:8].js",
    path: buildPath,
  },

  optimization: {
    minimize: true,
    minimizer: [`...`, new CssMinimizerPlugin()],
  },

  devtool: "source-map",
  stats: "errors-only",
  bail: true,

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: true,
      chunks: ["index"],
      filename: "index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash:8].css",
      chunkFilename: "[id].[contenthash:8].css",
    }),
  ],

  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "html-loader",
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(jpe?g|png|svg)$/,
        type: "asset/resource",
      },
    ],
  },
};
