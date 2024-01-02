const webpack = require("@nativescript/webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const { resolve } = require('path');

module.exports = (env) => {
        webpack.init(env);

        webpack.chainWebpack(config => {

            config.resolve.alias.set('@nativescript/core/utils/utils', '@nativescript/core/utils');
		    config.resolve.alias.set('tns-core-modules/utils/utils', '@nativescript/core/utils');
		    config.resolve.alias.set('tns-core-modules', '@nativescript/core');
            config.resolve.alias.set('./map-view', resolve(__dirname, 'node_modules/@nativescript/core'));

            config.plugin('DefinePlugin').tap(args => {
                Object.assign(args[0], {
                    'global.isProduction': !!env.production,
                })
                Object.assign(args[0], {
                    "process": JSON.stringify('HELLO'),
                    "process.env": JSON.stringify('HELLO'),
                    // "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
                })
                return args
            })
            config.plugin("polyfills").use(NodePolyfillPlugin);
            config.resolve.set('fallback', {
                fs: false,
                net: false,
                tls: false,
                dns: false,
                child_process: false,
                async_hooks: false,
                module: false,
                nock: false,
                "aws-sdk": false,
                "mock-aws-s3": false,
                process: "process/browser"
                });
            // config.module.rule('js').use('sass-loader').loader('sass-loader').options({
            //     example: true
            // });

            config.resolve.set('fallback', { 
                "crypto": require.resolve("crypto-browserify"),
                "url": require.resolve("url"),
                "http": require.resolve("stream-http"),
                "stream": require.resolve("stream-browserify")
            });
        });

        return webpack.resolveConfig();
};