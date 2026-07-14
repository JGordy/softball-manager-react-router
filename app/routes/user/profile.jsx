import { useEffect, useState } from "react";
import {
    useActionData,
    useOutletContext,
    useLocation,
    useNavigate,
} from "react-router";

import { Container, Box } from "@mantine/core";

import UserHeader from "@/components/UserHeader";

import { updateUser } from "@/actions/users";

import {
    getAttendanceByUserId,
    getAwardsByUserId,
    getUserById,
    getStatsByUserId,
    getAchievementsByUserId,
} from "@/loaders/users";

import { useResponseNotification } from "@/utils/showNotification";
import { appwriteClientContext } from "@/contexts/router";
import {
    getIncompleteProfileFields,
    REQUIRED_PROFILE_FIELDS,
} from "@/utils/users";

import AlertIncomplete from "./components/AlertIncomplete";
import ProfileMenu from "./components/ProfileMenu";

import MobileProfileView from "./components/MobileProfileView";
import DesktopProfileView from "./components/DesktopProfileView";

export function links() {
    const fieldSrc = `${import.meta.env.VITE_APPWRITE_HOST_URL}/storage/buckets/67af948b00375c741493/files/67b00f90002a66960ba4/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}&mode=admin`;
    return [{ rel: "preload", href: fieldSrc, as: "image" }];
}

export async function action({ request, params, context }) {
    const { userId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "edit-player") {
        const sessionClient = context.get(appwriteClientContext);
        return updateUser({ values, userId, client: sessionClient });
    }
}

export async function loader({ params, request, context }) {
    const { userId } = params;
    const url = new URL(request.url);
    const hash = url.hash.replace(/^#/, "") || null;

    const validTabs = [
        "player",
        "stats",
        "awards",
        "attendance",
        "achievements",
    ];
    const defaultTab = validTabs.includes(hash) ? hash : "player";

    const sessionClient = context.get(appwriteClientContext);

    const headerStatsPromise = (async () => {
        const { Query } = await import("node-appwrite");
        const serverModule = await import("@/utils/appwrite/server");
        const createAdminClient =
            serverModule.createAdminClient ||
            serverModule.default?.createAdminClient;
        const { listDocuments } = await import("@/utils/databases");

        const [awardsResult, gameLogsResult] = await Promise.all([
            listDocuments(
                "awards",
                [Query.equal("winner_user_id", userId), Query.limit(1)],
                sessionClient,
            ).catch(() => ({ total: 0 })),
            listDocuments(
                "game_logs",
                [Query.equal("playerId", userId), Query.limit(1)],
                sessionClient,
            ).catch(() => ({ total: 0 })),
        ]);

        let teamCount = 0;
        try {
            const userAccount = await sessionClient.account
                .get()
                .catch(() => null);
            if (userAccount && userAccount.$id === userId) {
                const userTeams = await sessionClient.teams.list();
                teamCount = userTeams.total || userTeams.teams?.length || 0;
            } else if (createAdminClient) {
                const adminClient = createAdminClient();
                const rosters = await listDocuments(
                    "season_rosters",
                    [Query.equal("playerId", userId), Query.limit(100)],
                    adminClient,
                ).catch(() => ({ rows: [] }));
                const uniqueTeamIds = new Set(
                    rosters.rows?.map((r) => r.teamId) || [],
                );
                teamCount = uniqueTeamIds.size;
            }
        } catch (e) {
            console.error("Error getting team count for profile stats:", e);
        }

        return {
            awardsCount: awardsResult.total || 0,
            gameCount: gameLogsResult.total || 0,
            teamCount,
        };
    })();

    return {
        player: await getUserById({ userId, client: sessionClient }),
        awardsPromise: getAwardsByUserId({ userId, client: sessionClient }),
        attendancePromise: getAttendanceByUserId({
            userId,
            client: sessionClient,
        }),
        statsPromise: getStatsByUserId({ userId, client: sessionClient }),
        achievementsPromise: getAchievementsByUserId({
            userId,
            client: sessionClient,
        }),
        headerStatsPromise,
        defaultTab,
    };
}

export default function UserProfile({ loaderData }) {
    // console.log("UserProfile: ", { ...loaderData });
    const {
        awardsPromise,
        attendancePromise,
        statsPromise,
        achievementsPromise,
        headerStatsPromise,
        player,
        defaultTab,
    } = loaderData;

    const { user: loggedInUser } = useOutletContext(); // The currently logged-in user from layout
    const location = useLocation();
    const navigate = useNavigate();

    const actionData = useActionData();

    const isCurrentUser = loggedInUser?.$id === player?.$id;

    const incompleteKeys = getIncompleteProfileFields(player);
    const incompleteData = incompleteKeys.map(
        (key) => REQUIRED_PROFILE_FIELDS[key],
    );

    useResponseNotification(actionData);

    const validTabs = [
        "player",
        "stats",
        "awards",
        "attendance",
        "achievements",
    ];
    const [tab, setTab] = useState(defaultTab);

    // Keep tab state in sync when location.hash changes (back/forward navigation)
    useEffect(() => {
        const current = location?.hash?.replace(/^#/, "") || null;
        if (current && validTabs.includes(current) && current !== tab) {
            setTab(current);
        }
    }, [location.hash]);

    const handleTabChange = (value) => {
        if (!value) return;
        if (value === tab) return;
        setTab(value);

        const newHash = `#${value}`;
        // preserve pathname and search when updating hash so history works
        const url = `${location.pathname}${location.search}${newHash}`;
        navigate(url, { replace: false });
    };

    return (
        !!Object.keys(player).length && (
            <Box px="md" py="md">
                <UserHeader
                    subText="Here are your personal and player details"
                    stats={headerStatsPromise}
                >
                    {isCurrentUser && <ProfileMenu player={player} />}
                </UserHeader>

                <Container px={0}>
                    {isCurrentUser && incompleteData.length > 0 && (
                        <AlertIncomplete incompleteData={incompleteData} />
                    )}

                    <Box hiddenFrom="lg">
                        <MobileProfileView
                            tab={tab}
                            handleTabChange={handleTabChange}
                            player={player}
                            loggedInUser={loggedInUser}
                            awardsPromise={awardsPromise}
                            statsPromise={statsPromise}
                            achievementsPromise={achievementsPromise}
                        />
                    </Box>
                    <Box visibleFrom="lg">
                        <DesktopProfileView
                            tab={tab}
                            handleTabChange={handleTabChange}
                            player={player}
                            loggedInUser={loggedInUser}
                            awardsPromise={awardsPromise}
                            attendancePromise={attendancePromise}
                            statsPromise={statsPromise}
                            achievementsPromise={achievementsPromise}
                        />
                    </Box>
                </Container>
            </Box>
        )
    );
}

export function shouldRevalidate({
    currentUrl,
    nextUrl,
    defaultShouldRevalidate,
}) {
    if (
        currentUrl.pathname === nextUrl.pathname &&
        currentUrl.search === nextUrl.search
    ) {
        return false;
    }
    return defaultShouldRevalidate;
}
