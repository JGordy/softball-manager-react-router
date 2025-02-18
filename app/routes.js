import {
    index,
    layout,
    route,
} from "@react-router/dev/routes";

export default [
    // Authentication routes
    layout('components/LoggedWrapper.jsx', [
        route('/login', 'routes/auth/login.jsx'),
        route('/register', 'routes/auth/register.jsx'),
        route('/verify', 'routes/auth/verify.jsx'),


        layout('routes/layout.jsx', [
            index('routes/home/home.jsx'),

            // route("/forgot-password", "routes/auth/recover.jsx"),

            // User routes
            route('/user/:userId', 'routes/user/profile.jsx'),
            route('/user/:userId/teams', 'routes/user/teams.jsx'),

            // Team routes
            route('/user/:userId/teams/:teamId', 'routes/team/details.jsx'),

            // Gameday Routes
            route('/gameday/lineup', 'routes/gameday/lineup.jsx'),

            // Api routes
            route('/api/generate/lineup', 'routes/api/generate/lineup.js'),
        ]),
    ]),
];
