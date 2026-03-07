const React = require("react");

const MockIcon = React.forwardRef((props, ref) => {
    return React.createElement("svg", {
        ref,
        "data-testid": "tabler-icon",
        ...props,
    });
});
MockIcon.displayName = "MockIcon";

module.exports = new Proxy(
    {},
    {
        get: function (target, prop) {
            if (prop === "__esModule") return true;
            return MockIcon;
        },
    },
);
