const path = require("path");

module.exports = {
    entry: path.resolve(__dirname, "dist", "core", "iffinity.js"),
    output: {
        path: path.resolve(__dirname, "dist", "core"),
        filename: "iffinity-browser.js",
    },
    target: "web",
    mode: "production",
    module: {
        rules: [
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
    resolve: {
        fallback: {
            path: false,
            fs: false,
        },
    },
};
