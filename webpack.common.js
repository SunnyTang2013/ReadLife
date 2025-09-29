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
    entrypoints: true,
    errors: true,
    warnings: true,
    modules: false,
    chunks: false,
    colors: true
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  entry: {
    common: path.resolve(sourceDirectory, 'common/index.js'),
    globalConfig: path.resolve(sourceDirectory, 'globalConfig/index.js'),
    jobs: path.resolve(sourceDirectory, 'jobs/index.js'),
    configurations: path.resolve(sourceDirectory, 'configurations/index.js'),
    monitoring: path.resolve(sourceDirectory, 'monitoring/index.js'),
    releases: path.resolve(sourceDirectory, 'releases/index.js'),
    releaseManager: path.resolve(sourceDirectory, 'releaseManager/index.js'),
    user: path.resolve(sourceDirectory, 'user/index.js'),
    schedule: path.resolve(sourceDirectory, 'schedule/index.js'),
    pipelines: path.resolve(sourceDirectory, 'pipelines/index.js'),
    batches: path.resolve(sourceDirectory, 'batches/index.js'),
    searchCriteria: path.resolve(sourceDirectory, 'searchCriteria/index.js'),
    quantAqsCoverage: path.resolve(sourceDirectory, 'quantAqsCoverage/index.js'),
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
    publicPath: '/dist/',
    clean: true,
  },

  // Enable code splitting for smaller file sizes and better caching
  // All chunk files will be automatically placed in static/dist directory
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: false, // Disable runtime chunk splitting so each entry executes independently
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // React and React-DOM
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
        },
        
        // Put jQuery and popper.js in a separate chunk. The bootstrap JavaScript library (included
        // in `vendors` chunk) requires that jQuery and popper.js be loaded first.
        prerequisites: {
          test: /[\\/]node_modules[\\/](jquery|@popperjs\/core|popper\.js)[\\/]/,
          name: 'prerequisites',
          chunks: 'all',
          priority: 25,
        },

        // Chart.js and related charting libraries
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|echarts|echarts-for-react)[\\/]/,
          name: 'charts',
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
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { 
                targets: {
                  browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
                },
                useBuiltIns: 'entry',
                corejs: 3,
                modules: false
              }],
              ['@babel/preset-react', { 
                runtime: 'automatic',
                development: process.env.NODE_ENV === 'development'
              }]
            ],
            plugins: [
              '@babel/plugin-transform-class-properties',
              '@babel/plugin-transform-private-methods'
            ],
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          { 
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '/dist/'
            }
          },
          { 
            loader: 'css-loader', 
            options: { 
              url: true,
              sourceMap: process.env.NODE_ENV === 'development',
              importLoaders: 1
            } 
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb
          }
        },
        generator: {
          filename: 'images/[name].[hash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: 'fonts/[name].[hash][ext]'
        }
      },
    ],
  },

  resolve: {
    modules: ['node_modules', sourceDirectory],
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': sourceDirectory,
    },
    fallback: {
      "path": false,
      "fs": false
    }
  },
};
