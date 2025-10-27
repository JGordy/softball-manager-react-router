import { useEffect, useState } from "react";
import {
    useActionData,
    useOutletContext,
    useLocation,
    useNavigate,
} from "react-router";

import { Card, Container, Group, Tabs } from "@mantine/core";

import {
    IconAward,
    IconBallBaseball,
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
    IconUserSquareRounded,
} from "@tabler/icons-react";

import { useAuth } from "@/contexts/auth/useAuth";

import UserHeader from "@/components/UserHeader";
import PersonalDetails from "@/components/PersonalDetails";
import PlayerDetails from "@/components/PlayerDetails";

import { updateUser } from "@/actions/users";

import useModal from "@/hooks/useModal";

import { getAwardsByUserId } from "@/loaders/users";

import AlertIncomplete from "./components/AlertIncomplete";
import PlayerAwards from "./components/PlayerAwards";
import ProfileMenu from "./components/ProfileMenu";

const fieldsToDisplay = {
    email: {
        icon: <IconMail size={20} />,
        label: "email",
    },
    phoneNumber: {
        icon: <IconPhone size={20} />,
        label: "phone number",
    },
    gender: {
        icon: <IconFriends size={20} />,
        label: "gender",
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
        label: "walk up song",
    },
};

const fieldsToValidate = {
    ...fieldsToDisplay,
    gender: { label: "gender" },
    bats: { label: "bats" },
    throws: { label: "throws" },
    preferredPositions: { label: "preferred positions" },
    dislikedPositions: { label: "disliked positions" },
};

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

    return {
        awardsPromise: getAwardsByUserId({ userId }),
    };
}

export default function UserProfile({ loaderData }) {
    // console.log("UserProfile: ", { ...loaderData });
    const { awardsPromise } = loaderData;

    const { closeAllModals } = useModal();

    const { session } = useAuth();
    const { user: player } = useOutletContext();
    const location = useLocation();
    const navigate = useNavigate();

    const actionData = useActionData();

    const isCurrentUser = session?.userId === player?.$id;

    const incompleteData = Object.entries(fieldsToValidate)
        .filter(([key]) => {
            let value = player[key];
            return (
                value === null ||
                value === undefined ||
                (Array.isArray(value) && value.length === 0)
            );
        })
        .map(([key, data]) => data);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 204) {
                    closeAllModals();
                } else if (actionData instanceof Error) {
                    console.error(
                        "An error occurred while updating user data",
                        actionData.message,
                    );
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const validTabs = ["player", "personal", "awards"];
    const hash = location?.hash?.replace(/^#/, "") || null;
    const defaultTab = validTabs.includes(hash) ? hash : "player";

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

                <Tabs
                    radius="md"
                    value={tab}
                    onChange={handleTabChange}
                    mt="md"
                >
                    <Tabs.List grow justify="center">
                        <Tabs.Tab value="player">
                            <Group gap="xs" align="center" justify="center">
                                <IconBallBaseball size={16} />
                                Player
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="personal">
                            <Group gap="xs" align="center" justify="center">
                                <IconUserSquareRounded size={16} />
                                Personal
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="awards">
                            <Group gap="xs" align="center" justify="center">
                                <IconAward size={16} />
                                Awards
                            </Group>
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="player">
                        <PlayerDetails user={session} player={player} />
                    </Tabs.Panel>

                    <Tabs.Panel value="personal">
                        <PersonalDetails
                            user={session}
                            player={player}
                            fieldsToDisplay={fieldsToDisplay}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="awards">
                        <PlayerAwards awardsPromise={awardsPromise} />
                    </Tabs.Panel>
                </Tabs>
            </Container>
        )
    );
}
