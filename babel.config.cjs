module.exports = {
    presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        ["@babel/preset-react", { runtime: "automatic" }],
    ],
    plugins: [
        "transform-vite-meta-env",
        function () {
            return {
                visitor: {
                    MetaProperty(path) {
                        path.replaceWithSourceString(
                            "({ env: {}, hot: false })",
                        );
                    },
                },
            };
        },
    ],
};
