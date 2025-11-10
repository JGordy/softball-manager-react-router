import { useEffect, useState } from "react";

import { Button, Card, Container, Group, Text, Title } from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import getGames from "@/utils/getGames";

import useModal from "@/hooks/useModal";

import { getCurrentSession } from "@/services/auth";
import { Link, redirect } from "react-router";

import { IconPlus } from "@tabler/icons-react";

import branding from "@/constants/branding";

import GameCard from "@/components/GameCard";
import LoaderDots from "@/components/LoaderDots";
import UserHeader from "@/components/UserHeader";

import AddTeam from "@/forms/AddTeam";
import { createTeam } from "@/actions/teams";

import HomeMenu from "./components/HomeMenu";

export function meta() {
    return [
        { title: branding.name },
        { name: "description", content: branding.tagline },
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

    // console.log("/home ", { loaderData });
    const teams = loaderData?.teams;
    const userId = loaderData?.userId;

    const teamList = [...teams?.managing, ...teams?.playing];

    // helper to pick white or black text based on background hex color luminance
    const getContrastTextColor = (hexColor) => {
        if (!hexColor) return "#000";
        let hex = String(hexColor).replace("#", "");
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("");
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Perceived luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5 ? "#fff" : "#000";
    };

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

    // reset/initialize active index if team list changes
    useEffect(() => {
        if (!teamList || teamList.length === 0) {
            setActiveTeamIndex(-1);
            return;
        }

        // If index is out of range or not yet set, initialize to first slide.
        if (activeTeamIndex < 0 || activeTeamIndex >= teamList.length) {
            setActiveTeamIndex(0);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamList]);

    return (
        <Container>
            <UserHeader subText="Team and events summary">
                <HomeMenu userId={userId} />
            </UserHeader>

            <Group justify="space-between" align="center" mt="xl">
                <Title order={4}>My Teams ({teamList?.length || "0"})</Title>
                <Text component="div" size="sm" c="dimmed">
                    Click team card for details
                </Text>
            </Group>

            {/* No teams */}
            {!teamList?.length && (
                <Button variant="light" onClick={openAddTeamModal} fullWidth>
                    <Group>
                        <IconPlus size={18} />
                        <Text>{label}</Text>
                    </Group>
                </Button>
            )}

            {/* Single team: show a simple card and add button */}
            {teamList?.length === 1 && (
                <Card radius="md" py="lg" mt="md" withBorder>
                    <Link to={`/team/${teamList[0].$id}`}>
                        <Card bg={teamList[0].primaryColor} p="md">
                            <Text c="white">{teamList[0].name}</Text>
                        </Card>
                    </Link>
                </Card>
            )}

            {/* Multiple teams: carousel */}
            {teamList?.length >= 2 && (
                <Carousel
                    controlsOffset="xs"
                    slideSize="85%"
                    slideGap="lg"
                    emblaOptions={{
                        loop: true,
                        align: "center",
                    }}
                    onSlideChange={(index) => setActiveTeamIndex(index)}
                    pb="md"
                    withIndicators
                    withControls={false}
                >
                    {teamList.map((team, index) => {
                        const isActive = index === activeTeamIndex;

                        // determine contrast text color and use team primary color as background
                        const bgColor = team.primaryColor || "#ffffff";
                        const textColor = getContrastTextColor(bgColor);

                        // When there are exactly two slides we only adjust margins
                        // so the first slide gets left margin and the last gets right margin
                        // to prevent edge clipping while keeping slideSize at 85%.
                        const isTwo = teamList?.length === 2;
                        const isFirst = index === 0;
                        const isLast = index === teamList.length - 1;
                        const slideMarginLeft = isTwo && isFirst ? 12 : 0;
                        const slideMarginRight = isTwo && isLast ? 12 : 0;

                        return (
                            <Carousel.Slide key={team.$id} my="lg">
                                <Link to={`/team/${team.$id}`}>
                                    <Card
                                        radius="lg"
                                        p="lg"
                                        style={{
                                            position: "relative",
                                            transform: isActive
                                                ? "scale(1.04)"
                                                : "scale(1)",
                                            transition:
                                                "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
                                            border: isActive
                                                ? `2px solid ${team.primaryColor}`
                                                : "1px solid rgba(0,0,0,0.06)",
                                            backgroundColor: bgColor,
                                            marginLeft: slideMarginLeft,
                                            marginRight: slideMarginRight,
                                        }}
                                    >
                                        <Text
                                            ta="center"
                                            c={textColor}
                                            style={{
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {team.name}
                                        </Text>
                                    </Card>
                                </Link>
                            </Carousel.Slide>
                        );
                    })}
                </Carousel>
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
