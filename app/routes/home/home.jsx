import { useEffect, useState } from "react";
import { DateTime } from "luxon";

import {
    Button,
    Card,
    Container,
    Group,
    ScrollArea,
    Text,
    Title,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import { Link, redirect } from "react-router";

import { IconPlus } from "@tabler/icons-react";

import { account } from "@/appwrite";

import LoaderDots from "@/components/LoaderDots";
import UserHeader from "@/components/UserHeader";
import GameCard from "@/components/GameCard";

import AddTeam from "@/forms/AddTeam";
import { createTeam } from "@/actions/teams";

import getGames from "@/utils/getGames";

import useModal from "@/hooks/useModal";

import { getCurrentSession } from "@/services/auth";

export function meta() {
    return [
        { title: "Rocket Roster" },
        { name: "description", content: "Welcome to Rocker Roster!" },
    ];
}

export async function clientLoader({ request }) {
    try {
        const session = await getCurrentSession();

        if (!session) {
            throw redirect("/login");
        }

        const { userId } = session;
        const teamsResponse = await fetch("/api/teams", {
            method: "POST",
            body: JSON.stringify({ userId, teamRoles: ["manager", "player"] }),
        });
        if (!teamsResponse.ok) {
            const errorData = await teamsResponse.json();
            throw new Error(errorData.message || "Error fetching teams");
        }

        const { managing = [], playing = [] } = await teamsResponse.json();

        return {
            teams: { managing, playing },
            userId,
        };
    } catch (error) {
        console.error("Error in clientLoader:", error);
        return redirect("/login");
    }
}

clientLoader.hydrate = true;

export function HydrateFallback() {
    return <LoaderDots message="Fetching your teams and events..." />;
}

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === "add-team") {
        return createTeam({ values, userId });
    }
}

export default function HomePage({ loaderData, actionData }) {
    const { openModal, closeAllModals } = useModal();

    console.log("/home ", { loaderData });
    const teams = loaderData?.teams;
    const userId = loaderData?.userId;

    const teamList = [...teams?.managing, ...teams?.playing];

    // Track the active team shown in the carousel. Default to the first team if present.
    const [activeTeamIndex, setActiveTeamIndex] = useState(
        teamList && teamList.length ? 0 : -1,
    );

    const activeTeamId = teamList?.[activeTeamIndex]?.$id;

    // Compute games only for the active team so the Next/Most Recent cards reflect
    // the team shown in the carousel.
    const { futureGames, pastGames } = getGames({
        teams: teamList,
        teamId: activeTeamId,
    });

    const nextGame = futureGames?.slice(0, 1)?.[0];
    const mostRecentGame = pastGames?.slice(0, 1)?.[0];

    const daysUntilNextGame = (date) => {
        // date is expected to be an ISO string stored in UTC. Use Luxon for safe arithmetic.
        const today = DateTime.utc();
        const gameDate = DateTime.fromISO(date, { zone: "utc" });

        const timeDiff = gameDate.toMillis() - today.toMillis();
        const daysUntilGame = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Calculate days
        const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? "s" : ""}`;

        return ` in ${daysUntilText}!`;
    };

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 201) {
                    closeAllModals();
                } else if (actionData instanceof Error) {
                    console.error(
                        "An error occurred during team creation.",
                        actionData.message,
                    );
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    console.log("/home ", { nextGame, futureGames, pastGames, userId });

    const openAddTeamModal = () =>
        openModal({
            title: "Add a New Team",
            children: <AddTeam actionRoute={"/"} userId={userId} />,
        });

    // reset active index if team list changes or becomes shorter
    useEffect(() => {
        if (!teamList || teamList.length === 0) {
            setActiveTeamIndex(-1);
        } else if (activeTeamIndex < 0 || activeTeamIndex >= teamList.length) {
            setActiveTeamIndex(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamList]);

    const addTeamButton = (label = "Add team") => (
        <Button variant="light" onClick={openAddTeamModal} fullWidth>
            <Group>
                <IconPlus size={18} />
                <Text>{label}</Text>
            </Group>
        </Button>
    );

    return (
        <Container>
            <UserHeader subText="Here is a summary of all of your team and event info" />

            <Title order={4} mt="xl">
                My Teams ({teamList?.length || "0"})
            </Title>

            {/* No teams */}
            {!teamList?.length && addTeamButton("Create your first team")}

            {/* Single team: show a simple card and add button */}
            {teamList?.length === 1 && (
                <>
                    <Card radius="md" py="lg" mt="md" withBorder>
                        <Link to={`/team/${teamList[0].$id}`}>
                            <Card bg={teamList[0].primaryColor} p="md">
                                <Text c="white">{teamList[0].name}</Text>
                            </Card>
                        </Link>
                    </Card>
                    {addTeamButton()}
                </>
            )}

            {/* Multiple teams: carousel */}
            {teamList?.length >= 2 && (
                <>
                    <Carousel
                        controlsOffset="xs"
                        slideSize="85%"
                        slideGap="md"
                        emblaOptions={{
                            loop: true,
                            dragFree: false,
                            align: "center",
                        }}
                        onSlideChange={(index) => setActiveTeamIndex(index)}
                    >
                        {teamList.map((team) => (
                            <Carousel.Slide key={team.$id} my="lg">
                                <Card radius="lg" p="lg">
                                    <Link to={`/team/${team.$id}`}>
                                        <Card bg={team.primaryColor} p="md">
                                            <Text c="white" ta="center">
                                                {team.name}
                                            </Text>
                                        </Card>
                                    </Link>
                                </Card>
                            </Carousel.Slide>
                        ))}
                    </Carousel>
                    {addTeamButton()}
                </>
            )}

            {/* Next Game (for active team) */}
            {nextGame && Object.keys(nextGame).length > 0 && (
                <>
                    <Title order={4} mt="xl" mb="xs">
                        Upcoming Events
                    </Title>
                    <GameCard {...nextGame} />
                </>
            )}

            {/* Most Recent Game (for active team) */}
            {mostRecentGame && Object.keys(mostRecentGame).length > 0 && (
                <>
                    <Title order={4} mt="xl" mb="xs">
                        Most Recent Game
                    </Title>
                    <GameCard {...mostRecentGame} />
                </>
            )}
        </Container>
    );
}
