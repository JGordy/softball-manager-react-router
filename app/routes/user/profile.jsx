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
} from "@/loaders/users";

import { useResponseNotification } from "@/utils/showNotification";
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

export async function action({ request, params }) {
    const { userId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "edit-player") {
        return updateUser({ values, userId });
    }
}

export async function loader({ params, request }) {
    const { userId } = params;
    const url = new URL(request.url);
    const hash = url.hash.replace(/^#/, "") || null;

    const validTabs = ["player", "stats", "awards", "attendance"];
    const defaultTab = validTabs.includes(hash) ? hash : "player";

    return {
        player: await getUserById({ userId }),
        awardsPromise: getAwardsByUserId({ userId }),
        attendancePromise: getAttendanceByUserId({ userId }),
        defaultTab,
    };
}

export default function UserProfile({ loaderData }) {
    // console.log("UserProfile: ", { ...loaderData });
    const { awardsPromise, attendancePromise, player, defaultTab } = loaderData;

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

    const validTabs = ["player", "stats", "awards", "attendance"];
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
                <UserHeader subText="Here are your personal and player details">
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
                        />
                    </Box>
                </Container>
            </Box>
        )
    );
}
