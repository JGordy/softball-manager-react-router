import { Card, Skeleton, Text } from "@mantine/core";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";

import CardSection from "./CardSection";
import { isUserAwardWinner } from "@/utils/awards";

export default function AwardsContainer({ deferredData, user, onOpen }) {
    return (
        <>
            <Card
                radius="xl"
                mt="md"
                mx="md"
                py="5px"
                data-testid="awards-container"
            >
                <CardSection
                    onClick={onOpen}
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
                                <InlineError
                                    message="Error loading awards details"
                                    mt="5px"
                                    ml="28px"
                                />
                            }
                        >
                            {({ awards, votes, achievements }) => {
                                const achievementsTotal =
                                    achievements?.length ?? 0;
                                const awardsTotal = awards?.total ?? 0;
                                const votesTotal = votes?.total ?? 0;

                                let message = "Awards unavailable at this time";
                                let color = "dimmed";

                                const userId = user?.$id;
                                const userAward = isUserAwardWinner(
                                    userId,
                                    awards,
                                    votes,
                                );
                                const userAchievement = achievements?.some(
                                    (ua) => ua.userId === userId,
                                );

                                if (userAward) {
                                    message = "You've received an award!";
                                    color = "orange";
                                } else if (userAchievement) {
                                    message = "Achievement unlocked!";
                                    color = "lime";
                                } else if (achievementsTotal > 0) {
                                    message = `${achievementsTotal} achievement${achievementsTotal === 1 ? "" : "s"} unlocked`;
                                    color = "lime";
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
        </>
    );
}
