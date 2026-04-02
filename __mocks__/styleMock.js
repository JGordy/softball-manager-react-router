const proxy = new Proxy(
    {},
    {
        get: (target, key) => {
            if (key === "default") return proxy;
            return key;
        },
    },
);

module.exports = proxy;
