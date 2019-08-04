const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    //添加两个webpack打包入口
    entry: {
        'navigation-map': ['./js/navigation-map/navigationMapInit.js'],
        'halo-animation': './js/halo-animation/main.js',
        'image-map':'./js/image-map/imageMap.js',
        'motion-track':'./js/motion-track/motionTrackInit.js',
        'flight-route': './js/flight-route/main.ts',
        'progress-circle': './js/progress-circle/main.ts',
        'integration-file': './js/integration-file/main.js',
        'bubble-text': './js/bubble-text/main.ts'
    },
    // devtool: "cheap-module-eval-source-map",
    devtool: "source-map",
    resolve: {
        alias: {
            '@': __dirname,
        },
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    //配置输出文件
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        inline:true,
        hot: true,
        host:"0.0.0.0",
        useLocalIp:true,
        https:false,
        openPage: 'progress-circle.html',
        progress:true,
        clientLogLevel: "info",
        watchContentBase: true,
        // proxy: {
        //     '/shop': {
        //         target: 'http://192.168.163.166:8767/shop',
        //         changeOrigin: true,// target是域名的话，需要这个参数，
        //         //pathRewrite: {'^/' : '/'}, // 重写路径
        //         secure: false,          // 设置支持https协议的代理
        //         logLevel: 'debug',
        //         prependPath:false
        //     }
        // }
    },
    module: {
        rules: [
            //添加babel-loader模块，编译js文件夹下的文件，排除node_modules下的js文件夹
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                },
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.scss|css$/,
                use: [
                    {loader: "style-loader"},
                    {loader: 'css-loader'},
                    {loader: 'sass-loader'}
                ]

            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./page/navigationMap.html",
            chunks: ["navigation-map"],
            filename: "navigation-map.html",
        }),
        new HtmlWebpackPlugin({
            template: "./page/haloAnimation.html",
            chunks: ["halo-animation"],
            filename: "halo-animation.html",
        }),
        new HtmlWebpackPlugin({
            template: "./page/imageMap.html",
            chunks: ["image-map"],
            filename: "image-map.html",
        }),
        new HtmlWebpackPlugin({
            template: "./page/motionTrack.html",
            chunks: ["motion-track"],
            filename: "motion-track.html",
        }),
        new HtmlWebpackPlugin({
            template: "./page/flightRouteMap.html",
            chunks: ["flight-route"],
            filename: "flight-route.html",
        }),
        new HtmlWebpackPlugin({
            template: "./page/ProgressCircleMap.html",
            chunks: ["progress-circle"],
            filename: "progress-circle.html",
        }),
        new HtmlWebpackPlugin({
            template: "./page/animationMap.html",
            chunks: ["integration-file"],
            filename: "integration-file.html",
        }),
        new HtmlWebpackPlugin({
            template: "./page/bubbleTextMap.html",
            chunks: ["bubble-text"],
            filename: "bubble-text.html",
        }),
        new webpack.HotModuleReplacementPlugin(),
        //拷贝文件夹中的文件到指定文件夹
        new CopyPlugin([
            {from: 'images', to: 'images'},
        ]),
    ]
}
