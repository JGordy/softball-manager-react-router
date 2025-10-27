import { Card, Skeleton, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useCallback, useEffect } from "react";
import { useLocation } from "react-router";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";

import CardSection from "./CardSection";
import AwardsDrawerContents from "./AwardsDrawerContents";

export default function AwardsContainer({ game, team, deferredData, user }) {
    const [awardsDrawerOpened, awardsDrawerHandlers] = useDisclosure(false);

    const handleOpen = useCallback(() => {
        awardsDrawerHandlers.open();
    }, [awardsDrawerHandlers]);

    const location = useLocation();

    // Open drawer automatically when URL indicates it (either hash #awards
    // or query ?open=awards). This lets other pages link to a game and
    // request the awards drawer open on arrival. Run this only once on mount
    // (so it doesn't re-open when the URL remains unchanged) — we also
    // remove the hash/query when the drawer is closed below.
    useEffect(() => {
        const hash = location?.hash?.replace(/^#/, "") || null;
        const params = new URLSearchParams(location?.search || "");
        const openParam = params.get("open");

        let timer;
        if (hash === "awards" || openParam === "awards") {
            // delay opening slightly so the navigation visual completes
            timer = setTimeout(() => {
                awardsDrawerHandlers.open();
            }, 500);
        }

        // cleanup timer on unmount
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
        // We intentionally run once on mount. eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close handler that also removes the hash/query param so the drawer
    // won't auto-open again when the URL still contains #awards or open=awards.
    const handleClose = useCallback(() => {
        awardsDrawerHandlers.close();

        const hash = location?.hash?.replace(/^#/, "") || null;
        const params = new URLSearchParams(location?.search || "");
        const openParam = params.get("open");

        // Only modify URL if hash or open param indicated awards
        if (hash === "awards" || openParam === "awards") {
            // remove open param
            params.delete("open");
            const search = params.toString();
            const newUrl = `${location.pathname}${search ? `?${search}` : ""}`;

            // Use the History API to replace the URL without triggering
            // React Router navigation/loaders. This prevents a page refresh
            // or loader run when the drawer is simply closed.
            if (
                typeof window !== "undefined" &&
                window.history &&
                window.history.replaceState
            ) {
                try {
                    window.history.replaceState(
                        window.history.state,
                        "",
                        newUrl,
                    );
                } catch (e) {
                    // fallback to navigate.replace if replaceState fails for any reason
                    // eslint-disable-next-line no-console
                    console.warn(
                        "replaceState failed, URL may update with navigation",
                        e,
                    );
                }
            }
        }
    }, [awardsDrawerHandlers, location]);

    return (
        <>
            <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    onClick={handleOpen}
                    heading="Awards & Recognition"
                    leftSection={<IconAward size={20} />}
                    subHeading={
                        <DeferredLoader
                            resolve={deferredData}
                            fallback={
                                <Skeleton
                                    height={16}
                                    width="70%"
                                    mt="5px"
                                    ml="28px"
                                    radius="xl"
                                />
                            }
                            errorElement={
                                <Text size="xs" mt="5px" ml="28px" c="red">
                                    Error loading awards details
                                </Text>
                            }
                        >
                            {({ awards, votes }) => {
                                const awardsTotal = awards?.total ?? 0;
                                const votesTotal = votes?.total ?? 0;

                                let message = "Awards unavailable at this time";
                                let color = "dimmed";

                                // If the current user appears as a winner in any awards document,
                                // show a personalized message.
                                const userId = user?.$id;
                                const userAward =
                                    userId &&
                                    awards?.documents?.some(
                                        (doc) => doc.winner_user_id === userId,
                                    );

                                if (userAward) {
                                    message = "You've received an award!";
                                    color = "orange";
                                } else if (awardsTotal > 0) {
                                    message = "Awards ready for view";
                                    color = "yellow";
                                } else if (votesTotal > 0) {
                                    message = "Voting in progress";
                                    color = "blue";
                                }

                                return (
                                    <Text
                                        size="xs"
                                        mt="5px"
                                        ml="28px"
                                        c={color}
                                    >
                                        {message}
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    }
                />
            </Card>

            <DrawerContainer
                opened={awardsDrawerOpened}
                onClose={handleClose}
                title="Awards & Recognition"
                size="95%"
            >
                <DeferredLoader
                    resolve={deferredData}
                    fallback={null}
                    errorElement={
                        <div>
                            <Text c="red">Error loading content.</Text>
                        </div>
                    }
                >
                    {(deferred) => (
                        <AwardsDrawerContents
                            game={game}
                            team={team}
                            user={user}
                            {...deferred}
                        />
                    )}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
