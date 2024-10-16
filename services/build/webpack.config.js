var path = require('path');

module.exports = {
  mode: 'production',
  entry: './app/src/app.js',
  watch: true,
  output: {
    path: path.resolve(__dirname, 'app/prod'),
    filename: 'app.js'
  },
  resolve: {
    modules: [__dirname, 'app/node_modules'],
  },
  resolveLoader: {
    modules: [__dirname, 'app/node_modules'],
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.(snippet)$/i,
        use: [
          {
            loader: 'raw-loader'
          }
        ]
      },
      {
        test: /\.(csv)$/i,
        use: [
          {
            loader: 'csv-loader'
          }
        ]
      },
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            "exclude": [
              /app\/node_modules[\\\/]core-js/,
              /app\/node_modules[\\\/]webpack[\\\/]buildin/,
            ],
            "presets": [
              [path.resolve(__dirname, 'app/node_modules/@babel/preset-env'),  {"targets": "ie 11"}]
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader'
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader'
        ],
      },
      {
        test: /\.twig$/,
        loader: "twig-loader"
      }
    ],
  },
  optimization: {
    usedExports: true,
  },
};