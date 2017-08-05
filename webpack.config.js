const path = require('path');
const version = require('./package.json').version;
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

const loaders = [
    {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
    }
];

module.exports = [
    {
        entry: path.resolve(process.cwd(), 'lib/extension.js'),
        output: {
            filename: 'extension.js',
            path: path.resolve(process.cwd(), 'brainsprite/static'),
            libraryTarget: 'amd'
        }
    },
    {
        entry: path.resolve(process.cwd(), './lib/widget.js'),
        output: {
            filename: 'widget.js',
            path: path.resolve(process.cwd(), './brainsprite/static'),
            libraryTarget: 'amd'
        },
        externals: ['@jupyter-widgets/base']
    },
    {
        entry: path.resolve(process.cwd(), './lib/brainsprite.js'),
        output: {
            filename: 'brainsprite.js',
            path: path.resolve(process.cwd(), './dist/'),
        },
        plugins: process.env.NODE_ENV == 'prod' ? [
            new UglifyJSPlugin(),
        ] : [],
        target: 'web',
    },
    {
        entry: path.resolve(process.cwd(), './lib/embed.js'),
        output: {
            filename: 'embed.js',
            path: path.resolve(process.cwd(), './dist/'),
            libraryTarget: 'amd',
            publicPath: 'https://unpkg.com/brainsprite@' + version + '/dist/'
        },
        devtool: 'source-map',
        module: {
            loaders: loaders
        },
        externals: ['@jupyter-widgets/base'],
        target: 'web',
    }
];
