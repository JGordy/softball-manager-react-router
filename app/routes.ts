import {
    type RouteConfig,
    index,
    layout,
    route,
} from "@react-router/dev/routes";

// const ProtectedLayout = ({ loaderData }: { loaderData: any }) => {

//     // Check for the redirect flag set in your loader.
//     if (loaderData?.redirectToLogin) {  // Changed this line
//         throw redirect("/login");
//     }

//     return <Outlet context={ loaderData } />;
// };

export default [
    layout('routes/layout.jsx', [
        index('routes/home/home.jsx'),

        // Authentication routes
        route('/login', 'routes/auth/login.jsx'),
        route('/register', 'routes/auth/register.jsx'),
        route('/verify', 'routes/auth/verify.jsx'),
        // route("/forgot-password", "routes/auth/recover.jsx"),

        // User routes
        route('/user/:userId', 'routes/user/dashboard.jsx'),

        // Gameday Routes
        route('/gameday/lineup', 'routes/gameday/lineup.jsx'),

        // Team routes
        route('/teams/:teamId', 'routes/team/details.jsx'),

        // Api routes
        route('/api/generate/lineup', 'routes/api/generate/lineup.js'),
    ]),

] satisfies RouteConfig;
