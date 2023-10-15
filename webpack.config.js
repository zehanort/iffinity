const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

module.exports = {
    entry: path.resolve(__dirname, "dist", "core", "iffinity.js"),
    output: {
        path: path.resolve(__dirname, "dist", "core"),
        filename: "iffinity-browser.js",
    },
    mode: "production",

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
            },
            {
                test: require.resolve("jquery"),
                use: [
                    {
                        loader: "expose-loader",
                        options: {
                            exposes: ["$", "jQuery"],
                        },
                    },
                ],
            },
        ],
    },

    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
        }),
        new TerserPlugin(),
    ],

    resolve: {
        fallback: {
            path: false,
            fs: false,
        },
    },
};
