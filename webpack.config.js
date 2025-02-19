const path = require('path');

module.exports = {
    devtool:'source-map',
    mode: 'development',
    entry: {
        client: './dist/client/client/ws-componentes.js',
        //unlogged:'./dist/unlogged/unlogged.js',
    },
    output: {
        filename: '[name]/[name]/[name]-bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'], // Importante: incluye .tsx y .ts
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },{
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            }
        ],
    }
};