const path = require('path');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Resolve directories relative to `__dirname`.
const sourceDirectory = path.resolve(__dirname, './src/main/frontend');
const outputDirectory = path.resolve(__dirname, './build/resources/main/static/dist');


module.exports = {
  target: 'web',
  stats: {
    entrypoints: true
  },
  entry: {
    common: path.resolve(sourceDirectory, 'common/index.js'),
    globalConfig: path.resolve(sourceDirectory, 'globalConfig/index.js'),
    jobs: path.resolve(sourceDirectory, 'jobs/index.js'),
    configurations: path.resolve(sourceDirectory, 'configurations/index.js'),
    monitoring: path.resolve(sourceDirectory, 'monitoring/index.js'),
    releases: path.resolve(sourceDirectory, 'releases/index.js'),
    user: path.resolve(sourceDirectory, 'user/index.js'),
    schedule: path.resolve(sourceDirectory, 'schedule/index.js'),
    pipelines: path.resolve(sourceDirectory, 'pipelines/index.js'),
    batches: path.resolve(sourceDirectory, 'batches/index.js'),
    searchCriteria: path.resolve(sourceDirectory, 'searchCriteria/index.js'),
    quantAqsCoverage: path.resolve(sourceDirectory, 'quantAqsCoverage/index.js'),
    onDemandConfig: path.resolve(sourceDirectory, 'onDemandConfig/index.js'),
    metrics: path.resolve(sourceDirectory, 'metrics/index.js'),
    profile: path.resolve(sourceDirectory, 'profile/index.js'),
    tools: path.resolve(sourceDirectory, 'tools/index.js'),
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css', // Use the chunk name instead of its id (`[id].css`).
    }),
    new CleanWebpackPlugin(),
  ],

  output: {
    path: outputDirectory,
    filename: '[name].bundle.js',
  },

  devServer: {
    static: {
      directory: path.join(__dirname, outputDirectory),
    },
    port: 8088,
    hot: true,
    historyApiFallback: true, // Support React Router
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  // See: https://webpack.js.org/plugins/split-chunks-plugin/
  optimization: {
    splitChunks: {
      cacheGroups: {

        // Put jQuery and popper.js in a separate chunk. The bootstrap JavaScript library (included
        // in `vendors` chunk) requires that jQuery and popper.js be loaded first.
        spa: {
          test: /[\\/]node_modules[\\/](jquery|popper\.js)[\\/]/,
          name: 'prerequisites',
          chunks: 'all',
          priority: 20,
        },

        // With a lower priority, put all other vendor packages (from `node_modules`) in a chunk.
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
      },
    },
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { 
                targets: 'defaults',
                useBuiltIns: 'entry',
                corejs: 3
              }],
              ['@babel/preset-react', { 
                runtime: 'classic'
              }]
            ],
            plugins: [
              '@babel/plugin-transform-class-properties',
              '@babel/plugin-transform-private-methods'
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { url: true } },
          // { loader: 'postcss-loader' },
          // { loader: 'sass-loader' },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        // https://webpack.js.org/loaders/css-loader/#assets
        type: "asset",
      },
      {
        // https://webpack.js.org/loaders/css-loader/#assets
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: "asset",
      },
    ],
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js'],
  },
};
