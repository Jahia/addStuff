const path = require('path');
const {ModuleFederationPlugin} = require('webpack').container;
const moonstone = require('@jahia/moonstone/dist/rulesconfig-wp');

module.exports = (env, argv) => ({
    entry: {
        main: path.resolve(__dirname, 'src/javascript/index.js')
    },
    output: {
        path: path.resolve(__dirname, 'src/main/resources/javascript/apps'),
        filename: 'addstuff.bundle.js',
        chunkFilename: '[name].addstuff.[contenthash:6].js',
        publicPath: 'auto'
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    externals: {
        '@jahia/app-shell/bootstrap': 'appShell'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {targets: {chrome: '60', firefox: '60'}}],
                            '@babel/preset-react'
                        ]
                    }
                }
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[name]_[local]_[hash:base64:5]'
                            }
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.css$/,
                exclude: /node_modules[\\/]@jahia[\\/]moonstone/,
                use: ['style-loader', 'css-loader']
            },
            ...moonstone
        ]
    },
    plugins: [
        new ModuleFederationPlugin({
            name: 'addstuff',
            library: {type: 'assign', name: 'appShell.remotes.addstuff'},
            filename: 'remoteEntry.js',
            exposes: {
                '.': './src/javascript/init'
            },
            remotes: {
                '@jahia/jcontent': 'appShell.remotes.jcontent'
            },
            shared: {
                react: {singleton: true, requiredVersion: '*'},
                'react-dom': {singleton: true, requiredVersion: '*'},
                'react-i18next': {singleton: true, requiredVersion: '*'},
                i18next: {singleton: true, requiredVersion: '*'},
                '@apollo/client': {singleton: true, requiredVersion: '*'},
                '@jahia/moonstone': {singleton: true, requiredVersion: '*'},
                '@jahia/ui-extender': {singleton: true, requiredVersion: '*'},
                '@jahia/data-helper': {singleton: true, requiredVersion: '*'}
            }
        })
    ]
});
