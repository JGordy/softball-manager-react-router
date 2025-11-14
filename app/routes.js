import { index, layout, route } from "@react-router/dev/routes";

export default [
    // Authentication routes (public)
    route("/login", "routes/auth/login.jsx"),
    route("/register", "routes/auth/register.jsx"),
    route("/verify", "routes/auth/verify.jsx"),
    route("/recovery", "routes/auth/recover.jsx"),

    // The App shell (NavBar) in layout.jsx - protected routes
    layout("routes/layout.jsx", [
        // index('routes/home/home.jsx'),
        route("/", "routes/home/home.jsx"),

        // User routes
        route("/user/:userId", "routes/user/profile.jsx"),
        // TODO: Eventually make this the profile route?
        // route('/user/:userId/profile', 'routes/user/profile.jsx'),
        route("/teams", "routes/user/teams.jsx"),
        // route('/user/:userId/events', 'routes/user/events.jsx'),

        // Team routes
        route("/team/:teamId", "routes/team/details.jsx"),

        // Season routes
        route("/season/:seasonId", "routes/season/details.jsx"),

        // Events routes
        route("/events", "routes/events/list.jsx"),
        route("/events/:eventId", "routes/events/details.jsx"),
        route("/events/:eventId/lineup", "routes/events/lineup.jsx"),

        // User settings routes
        route("/settings", "routes/settings/index.jsx"),

        // Api routes
        route("/api/lineup", "routes/api/generate/lineup.js"),
        route(
            "/api/create-attendance",
            "routes/api/generate/create-attendance.js",
        ),
        route(
            "/api/get-availability",
            "routes/api/generate/get-availability.js",
        ),
        route("/api/teams", "routes/api/data/teams.js"),
        route("/api/profile", "routes/api/data/profile.js"),
        route("/api/user", "routes/api/data/user.js"),
        route("/api/resend-verification", "routes/api/resend-verification.js"),

        // Catch all route, 404
        route("*", "routes/notfound/404.jsx"),
    ]),
];
