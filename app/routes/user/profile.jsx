import { useEffect } from "react";
import { useActionData, useOutletContext } from "react-router";

import { Container, Tabs } from "@mantine/core";

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

import { getAttendanceByUserId, getAwardsByUserId } from "@/loaders/users";

import AlertIncomplete from "./components/AlertIncomplete";
import PlayerAwards from "./components/PlayerAwards";

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
        attendancePromise: getAttendanceByUserId({ userId, request }),
        awardsPromise: getAwardsByUserId({ userId }),
    };
}

export default function UserProfile({ loaderData }) {
    // console.log("UserProfile: ", { ...loaderData });
    const { awardsPromise } = loaderData;

    const { closeAllModals } = useModal();

    const { user } = useAuth();
    const { user: player } = useOutletContext();

    const actionData = useActionData();

    const isCurrentUser = user?.$id === player?.$id;

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

    return (
        !!Object.keys(player).length && (
            <Container>
                <UserHeader subText="Here are your personal and player details" />

                {isCurrentUser && incompleteData.length > 0 && (
                    <AlertIncomplete incompleteData={incompleteData} />
                )}

                <Tabs radius="md" defaultValue="player" mt="md">
                    <Tabs.List grow justify="center">
                        <Tabs.Tab
                            value="player"
                            leftSection={<IconBallBaseball size={16} />}
                        >
                            Player
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="personal"
                            leftSection={<IconUserSquareRounded size={16} />}
                        >
                            Personal
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="experience"
                            leftSection={<IconAward size={16} />}
                        >
                            Awards
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="player">
                        <PlayerDetails
                            user={user}
                            player={player}
                            isCurrentUser={isCurrentUser}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="personal">
                        <PersonalDetails
                            user={user}
                            player={player}
                            isCurrentUser={isCurrentUser}
                            fieldsToDisplay={fieldsToDisplay}
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="experience">
                        <PlayerAwards awardsPromise={awardsPromise} />
                    </Tabs.Panel>
                </Tabs>
            </Container>
        )
    );
}
