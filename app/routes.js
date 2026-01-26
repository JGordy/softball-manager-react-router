import { index, layout, route } from "@react-router/dev/routes";

export default [
    // Authentication routes (public)
    route("/login", "routes/auth/login.jsx"),
    route("/register", "routes/auth/register.jsx"),
    route("/verify", "routes/auth/verify.jsx"),
    route("/recovery", "routes/auth/recover.jsx"),
    route("/auth/oauth", "routes/auth/oauth.jsx"),
    route("/auth/callback", "routes/auth/callback.jsx"),

    // Landing Page
    route("/landing", "routes/landing/landing.jsx"),

    // Team invitation acceptance (public - users may not be logged in yet)
    route("/team/:teamId/accept-invite", "routes/team/accept-invite.jsx"),
    route("/auth/setup", "routes/auth/setup.jsx"),

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
        route("/team/:teamId/lineup", "routes/team/lineup.jsx"),

        // Season routes
        route("/season/:seasonId", "routes/season/details.jsx"),

        // Event routes
        route("/events", "routes/events/list.jsx"),
        route("/events/:eventId", "routes/events/details.jsx"),
        route("/events/:eventId/lineup", "routes/lineup/lineup.jsx"),
        route("/events/:eventId/gameday", "routes/gameday/gameday.jsx"),

        // User settings routes
        route("/settings", "routes/settings/index.jsx"),

        // Api routes
        route("/api/lineup", "routes/api/generate/lineup.js"),
        route("/api/push-target", "routes/api/push-target.js"),
        route("/api/resend-verification", "routes/api/resend-verification.js"),
        route("/api/session", "routes/api/session.js"),
        route("/api/test-notification", "routes/api/test-notification.js"),
        route(
            "/api/notifications/preferences",
            "routes/api/notifications/preferences.js",
        ),

        // Catch all route, 404
        route("*", "routes/notfound/404.jsx"),
    ]),
];
