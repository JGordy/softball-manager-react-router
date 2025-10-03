import { useEffect, useState } from "react";
import { Form, useSubmit } from "react-router";

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
                acc[vote.reason] = vote.nominated_user_id;
                return acc;
            }, {});

            setPlayerVotes(initialVotes);
        }
    }, [votes, user.$id]);

    const submit = useSubmit();

    const handleVote = (award, playerId) => {
        setPlayerVotes((prevVotes) => ({
            ...prevVotes,
            [award]: playerId,
        }));
    };

    const playersWithAvailability = addPlayerAvailability(
        attendance.documents,
        players,
    );

    console.log("Drawer: ", {
        playersWithAvailability,
        awards,
        votes,
        playerVotes,
    });

    const awardsList = Object.keys(awardsMap);

    const handleSubmit = (event) => {
        console.log({ playerVotes });

        event.preventDefault();

        const formData = new FormData();
        formData.append("playerVotes", JSON.stringify(playerVotes));
        formData.append("_action", "send-votes");
        formData.append("team_id", team.$id);
        formData.append("voter_user_id", user.$id);

        submit(formData, { action: `/events/${game.$id}`, method: "post" });
    };

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

            <Form method="post" onSubmit={handleSubmit}>
                <ScrollArea.Autosize h="50vh">
                    <Card radius="lg">
                        <Text ta="center" size="sm">
                            {awardsMap[activeAward].description}
                        </Text>
                    </Card>

                    <Stack mt="md" justify="space-between">
                        <Text fw="bold">Vote for a Player:</Text>
                        <Radio.Group
                            value={playerVotes[activeAward]}
                            onChange={(value) => handleVote(activeAward, value)}
                        >
                            <Stack>
                                {playersWithAvailability.map((player) => (
                                    <Radio.Card
                                        className={classes.radioCard}
                                        key={player.$id}
                                        value={player.$id}
                                        checked={
                                            playerVotes[activeAward] ===
                                            player.$id
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
                    autoContrast
                    fullWidth
                >
                    Submit Votes
                </Button>
            </Form>
        </Stack>
    );
}
