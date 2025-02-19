import {
    index,
    layout,
    route,
} from "@react-router/dev/routes";

export default [
    // Determines logged in status and appropriate redirects
    layout('components/AuthWrapper.jsx', [
        // Authentication routes
        route('/login', 'routes/auth/login.jsx'),
        route('/register', 'routes/auth/register.jsx'),
        route('/verify', 'routes/auth/verify.jsx'),
        // route("/forgot-password", "routes/auth/recover.jsx"),

        // The App shell (NavBar) in layout.jsx
        layout('routes/layout.jsx', [
            // TODO: What to make this?
            index('routes/home/home.jsx'),

            // User routes
            route('/user/:userId', 'routes/user/profile.jsx'),
            route('/user/:userId/teams', 'routes/user/teams.jsx'),
            // route('/user/:userId/events', 'routes/user/events.jsx'),


            // Team routes TODO: With AuthContext implemented can we lose the "/user/:userId" part of the path?
            route('/user/:userId/teams/:teamId', 'routes/team/details.jsx'),
            // TODO: Suggested
            // route('/teams/:teamId', 'routes/team/details.jsx'),
            // route('/teams/:teamId/seasons', 'routes/team/seasons.jsx'),
            // route('/teams/:teamId/games', 'routes/team/games.jsx'),

            // Gameday Routes
            route('/gameday/lineup', 'routes/gameday/lineup.jsx'),

            // Api routes
            route('/api/generate/lineup', 'routes/api/generate/lineup.js'),
        ]),
    ]),
];
