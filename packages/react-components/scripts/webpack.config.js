const path = require('path')
const { compact } = require('lodash');
const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const WebpackHashPlugin = require('../../bundle/scripts/webpackHashPlugin');

interface WebpackEnvArgs {
  analyze?: boolean;
  generateStatsFile?: boolean;
  findify_env?: 'staging'
}

const componentsPath = path.resolve(__dirname, '..');
const createGlobals = (isDevelopment) => [
  '__MERCHANT_CONFIG_URL__',
  '__MERCHANT_API_KEY__',
  '__MERCHANT_VERSION__',
  '__MERCHANT_CSS__',
  '__INCLUDE_POLYFILL__',
  '__ENVIRONMENT__',
  '__CONFIG__'
].reduce((acc, name) =>
  ({ ...acc, [name]: isDevelopment ? 'false' : `${name} || false` }), {}
)


export default (env: WebpackEnvArgs, { mode } = {mode: 'development'}) => {
  const config: webpack.Configuration = {
    entry: {
      'bundle': path.resolve(__dirname, '../src/index'),
    },
    devtool: 'source-map',
    output: {
      jsonpFunction: 'findifyJsonp',
      filename: '[name].js',
      chunkFilename: '[name].js',
      publicPath: process.env.PUBLIC_PATH || '/',
      path: path.resolve(__dirname, 'dist'),
    },

    devServer: {
      contentBase: path.resolve(__dirname, 'dist'),
      port: 3000,
      stats: 'minimal',
      historyApiFallback: true,
      hot: true
    },
    stats: 'minimal',
    bail: true,
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.css'],
      alias: {
        debug: path.resolve(__dirname, '../../../node_modules/debug'),
        immutable: path.resolve(__dirname, '../../../node_modules/immutable')
      }
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          include: [
            path.resolve(componentsPath, 'src')
          ],
          use: compact([
            mode === 'development' && 'style-loader',
            {
              loader: mode === 'development' ? 'css-loader' : 'css-loader/locals',
              options: {
                modules: true,
                camelCase: true,
                getLocalIdent: require(
                  path.resolve(componentsPath, 'scripts/getLocalIdent')
                )
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: path.resolve(componentsPath, 'postcss.config.js')
                }
              }
            }
          ])
        },
        {
          test: /\.ts$/,
          include: [
            path.resolve(__dirname, 'src'),
          ],
          use: ['babel-loader']
        },
        {
          test: /\.tsx?$/,
          include: [
            path.resolve(componentsPath, 'src'),
          ],
          use: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                extends: path.resolve(componentsPath, '.babelrc')
              }
            }
          ]
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        ...createGlobals(mode === 'development'),
        __root: 'window.findify',
        __COMMITHASH__: JSON.stringify(new GitRevisionPlugin().commithash()),
        'process.env': {
          BROWSER: true,
          FINDIFY_ENV: JSON.stringify(process.env.FINDIFY_ENV || 'production')
        },
        __DEBUG__: mode === 'development'
          ? 'base => props => { console.log(props); return base(props) }'
          : ''
      }),

      new DuplicatePackageCheckerPlugin(),

      new HtmlWebpackPlugin({
        hash: true,
        template:  path.resolve(__dirname, 'index.html'),
        inject: 'head'
      }),
    ],

  };

  if (Boolean(env && env.analyze)) {
    const analyzerPlugin = new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      analyzerPort: 8888,
      openAnalyzer: true,
      generateStatsFile: Boolean(env.generateStatsFile),
      reportFilename: 'stats/webpack.stats.html',
      statsFilename: 'stats/webpack.stats.json',
    });
    config.plugins!.push(analyzerPlugin);
  }

  if (mode === 'production') {
    config.plugins.push(new WebpackHashPlugin());
  }

  return config;
};
