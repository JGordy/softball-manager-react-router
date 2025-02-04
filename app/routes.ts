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
        route("/verify", "routes/auth/verify.jsx"),
        // route("/forgot-password", "routes/auth/recover.jsx"),

        // Gameday Routes
        route('/gameday/lineup', 'routes/gameday/lineup.jsx'),
        route('/api/generate/lineup', 'routes/api/generate/lineup.js'),
    ]),

] satisfies RouteConfig;
