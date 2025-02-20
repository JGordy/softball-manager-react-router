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
            // TODO: Eventually make this the profile route
            // route('/user/:userId/profile', 'routes/user/profile.jsx'),
            route('/teams', 'routes/user/teams.jsx'),
            // route('/user/:userId/events', 'routes/user/events.jsx'),


            // Team routes
            route('/team/:teamId', 'routes/team/details.jsx'),
            // TODO: Do we need seperate routes for these or display them in the team details in tabs?
            // route('/teams/:teamId/seasons', 'routes/team/seasons.jsx'),
            // route('/teams/:teamId/games', 'routes/team/games.jsx'),

            // Gameday Routes
            route('/gameday/lineup', 'routes/gameday/lineup.jsx'),

            // Api routes
            route('/api/generate/lineup', 'routes/api/generate/lineup.js'),
            route('/api/teams', 'routes/api/data/teams.js'),
        ]),
    ]),
];
