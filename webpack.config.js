const path = require('path');
const version = require('./package.json').version;

const loaders = [
    {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
            presets: ['es2015', 'stage-0']
        },
        exclude: /node_modules/,
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
