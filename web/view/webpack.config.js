const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, './src/app.tsx'),
    output: {
        path: path.resolve(__dirname, './dist/'),
        filename: 'app.js',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
//  devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader',
            }
        ]
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale/, /en\.js/)
    ]
    
};