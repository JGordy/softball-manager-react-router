import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import {
    Button,
    Card,
    Center,
    Group,
    Image,
    Radio,
    ScrollArea,
    Stack,
    Text,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import images from "@/constants/images";
import awardsMap from "@/constants/awards";

import classes from "@/styles/inputs.module.css";

import addPlayerAvailability from "../utils/addPlayerAvailability";

export default function AwardsDrawerContents({
    attendance,
    awards,
    game,
    team,
    players,
    user,
    votes,
}) {
    const [activeAward, setActiveAward] = useState("mvp");
    const [playerVotes, setPlayerVotes] = useState({});

    useEffect(() => {
        if (votes) {
            const userVotes = votes.documents.filter(
                (vote) => vote.voter_user_id === user.$id,
            );

            const initialVotes = userVotes.reduce((acc, vote) => {
                acc[vote.reason] = {
                    nominated_user_id: vote.nominated_user_id,
                    vote_id: vote.$id,
                };
                return acc;
            }, {});

            setPlayerVotes(initialVotes);
        }
    }, [votes, user.$id]);

    const fetcher = useFetcher();

    const handleVote = (award, playerId) => {
        setPlayerVotes((prevVotes) => ({
            ...prevVotes,
            [award]: {
                nominated_user_id: playerId,
                vote_id: prevVotes[award]?.vote_id,
            },
        }));
    };

    const handleSubmit = () => {
        try {
            const formData = new FormData();
            formData.append("playerVotes", JSON.stringify(playerVotes));
            formData.append("_action", "send-votes");
            formData.append("team_id", team.$id);
            formData.append("voter_user_id", user.$id);

            fetcher.submit(formData, {
                action: `/events/${game.$id}`,
                method: "post",
            });
        } catch (error) {
            console.error("Error submitting votes:", error);
        }
    };

    const playersWithAvailability = addPlayerAvailability(
        attendance.documents,
        players,
    );

    const awardsList = Object.keys(awardsMap);

    return (
        <Stack justify="center" align="stretch">
            <Carousel
                controlsOffset="xs"
                slideSize="85%"
                slideGap="md"
                emblaOptions={{
                    loop: true,
                    dragFree: false,
                    align: "center",
                }}
                onSlideChange={(index) => setActiveAward(awardsList[index])}
            >
                {awardsList.map((key) => (
                    <Carousel.Slide key={key}>
                        <Card radius="xl" my="sm">
                            <Center>
                                <Image
                                    src={images[key]}
                                    alt={`${images[key]} icon`}
                                    mah={150}
                                    maw={150}
                                />
                            </Center>
                        </Card>
                    </Carousel.Slide>
                ))}
            </Carousel>

            <ScrollArea.Autosize h="40vh">
                <Card radius="lg">
                    <Text ta="center" size="sm">
                        {awardsMap[activeAward].description}
                    </Text>
                </Card>

                <Stack mt="md" justify="space-between">
                    <Text fw="bold">Vote for a Player:</Text>
                    <Radio.Group
                        value={playerVotes[activeAward]?.nominated_user_id}
                        onChange={(value) => handleVote(activeAward, value)}
                    >
                        <Stack>
                            {playersWithAvailability.map((player) => (
                                <Radio.Card
                                    className={classes.radioCard}
                                    key={player.$id}
                                    value={player.$id}
                                    checked={
                                        playerVotes[activeAward]
                                            ?.nominated_user_id === player.$id
                                    }
                                    radius="lg"
                                >
                                    <Card radius="lg" py="sm" px="md">
                                        <Group>
                                            <Radio.Indicator />
                                            <Text>
                                                {player.firstName}{" "}
                                                {player.lastName}
                                            </Text>
                                        </Group>
                                    </Card>
                                </Radio.Card>
                            ))}
                        </Stack>
                    </Radio.Group>
                </Stack>
            </ScrollArea.Autosize>
            <Button
                variant="filled"
                radius="xl"
                mt="md"
                type="submit"
                loading={fetcher.state === "submitting"}
                onClick={handleSubmit}
                autoContrast
                fullWidth
            >
                Submit Votes
            </Button>
        </Stack>
    );
}
