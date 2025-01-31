import {
    type RouteConfig,
    index,
    layout,
    route,
} from "@react-router/dev/routes";

export default [
    layout("routes/layout.jsx", [
        index("routes/home.tsx"),

        // Authentication routes
        route("/login", "routes/auth/login.jsx"),
        route("/register", "routes/auth/register.jsx"),
        // route("/forgot-password", "routes/auth/recover.jsx"),
        route("/verify", "routes/auth/verify.jsx"),
    ]),

] satisfies RouteConfig;
