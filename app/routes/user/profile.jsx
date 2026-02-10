import { useEffect, useState } from "react";
import {
    useActionData,
    useOutletContext,
    useLocation,
    useNavigate,
} from "react-router";

import { Container, Group, Tabs } from "@mantine/core";

import {
    IconAward,
    // IconBallBaseball,
    IconClipboardData,
    IconUserSquareRounded,
} from "@tabler/icons-react";

import UserHeader from "@/components/UserHeader";
import PersonalDetails from "@/components/PersonalDetails";
import PlayerDetails from "@/components/PlayerDetails";
import TabsWrapper from "@/components/TabsWrapper";

import { updateUser } from "@/actions/users";

import { getAwardsByUserId, getUserById } from "@/loaders/users";

import { useResponseNotification } from "@/utils/showNotification";
import {
    getIncompleteProfileFields,
    REQUIRED_PROFILE_FIELDS,
} from "@/utils/users";

import AlertIncomplete from "./components/AlertIncomplete";
import PlayerAwards from "./components/PlayerAwards";
import PlayerStats from "./components/PlayerStats";
import ProfileMenu from "./components/ProfileMenu";

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

    const validTabs = ["player", "stats", "awards"];
    const defaultTab = validTabs.includes(hash) ? hash : "player";

    return {
        player: await getUserById({ userId }),
        awardsPromise: getAwardsByUserId({ userId }),
        defaultTab,
    };
}

export default function UserProfile({ loaderData }) {
    // console.log("UserProfile: ", { ...loaderData });
    const { awardsPromise, player, defaultTab } = loaderData;

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

    const validTabs = ["player", "stats", "awards"];
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
            <Container>
                <UserHeader subText="Here are your personal and player details">
                    {isCurrentUser && <ProfileMenu player={player} />}
                </UserHeader>

                {isCurrentUser && incompleteData.length > 0 && (
                    <AlertIncomplete incompleteData={incompleteData} />
                )}

                <TabsWrapper value={tab} onChange={handleTabChange}>
                    <Tabs.Tab value="player">
                        <Group gap="xs" align="center" justify="center">
                            <IconUserSquareRounded size={16} />
                            Details
                        </Group>
                    </Tabs.Tab>
                    {/* <Tabs.Tab value="personal">
                        <Group gap="xs" align="center" justify="center">
                            <IconUserSquareRounded size={16} />
                            Details
                        </Group>
                    </Tabs.Tab> */}
                    <Tabs.Tab value="stats">
                        <Group gap="xs" align="center" justify="center">
                            <IconClipboardData size={16} />
                            Stats
                        </Group>
                    </Tabs.Tab>
                    <Tabs.Tab value="awards">
                        <Group gap="xs" align="center" justify="center">
                            <IconAward size={16} />
                            Awards
                        </Group>
                    </Tabs.Tab>

                    <Tabs.Panel value="player">
                        <PersonalDetails player={player} user={loggedInUser} />
                        <PlayerDetails user={loggedInUser} player={player} />
                    </Tabs.Panel>

                    {/* <Tabs.Panel value="personal">
                    </Tabs.Panel> */}

                    <Tabs.Panel value="stats">
                        <PlayerStats playerId={player.$id} />
                    </Tabs.Panel>

                    <Tabs.Panel value="awards">
                        <PlayerAwards awardsPromise={awardsPromise} />
                    </Tabs.Panel>
                </TabsWrapper>
            </Container>
        )
    );
}
