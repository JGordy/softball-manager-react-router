import { useState } from "react";
import { Form, useSubmit } from "react-router";

import {
    Button,
    Card,
    Center,
    Group,
    Image,
    Radio,
    ScrollArea,
    Skeleton,
    Stack,
    Text,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useDisclosure } from "@mantine/hooks";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";

import images from "@/constants/images";

import classes from "@/styles/inputs.module.css";

import CardSection from "./CardSection";

import addPlayerAvailability from "../utils/addPlayerAvailability";

const awardsMap = {
    mvp: {
        description:
            "The one who brings it all together with outstanding performance and team leadership.",
    },
    batting: {
        description:
            "For the player who consistently crushes the ball and racks up the RBIs.",
    },
    fielding: {
        description:
            "Awarded to the defensive wizard who makes the impossible plays look easy.",
    },
    baserunning: {
        description:
            "To the speedster who turns singles into doubles and scores from anywhere.",
    },
    throwing: {
        description:
            "For the player with the most accurate and powerful arm on the field.",
    },
    manager: {
        description:
            "The strategic genius who leads the team to victory with brilliant decisions.",
    },
};

function AwardsDrawerContents({
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
    console.log({ awardsList });

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
                slideSize="80%"
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

export default function AwardsContainer({
    game,
    team,
    promises,
    playersPromise,
    user,
}) {
    const [awardsDrawerOpened, awardsDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    onClick={awardsDrawerHandlers.open}
                    heading="Awards & Recognition"
                    leftSection={<IconAward size={20} />}
                    subHeading={
                        <DeferredLoader
                            resolve={promises}
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
                                console.log("CardSection: ", { awards, votes });

                                return (
                                    <Text
                                        size="xs"
                                        mt="5px"
                                        ml="28px"
                                        c="dimmed"
                                    >
                                        Awards unavailable at this time
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    }
                />
            </Card>

            <DrawerContainer
                opened={awardsDrawerOpened}
                onClose={awardsDrawerHandlers.close}
                title="Awards & Recognition"
                size="95%"
            >
                <DeferredLoader
                    resolve={{ ...promises, players: playersPromise }}
                    fallback={
                        <Stack align="stretch" justify="center" gap="md">
                            <Skeleton height={200} radius="xl" my="lg" />
                            <Skeleton height={24} radius="xl" mb="md" />
                            <Skeleton height={24} radius="xl" mb="md" />
                            <Skeleton height={24} radius="xl" mb="md" />
                        </Stack>
                    }
                    errorElement={
                        <div>
                            <Text c="red">Error loading content.</Text>
                        </div>
                    }
                >
                    {(deferredData) => (
                        <AwardsDrawerContents
                            game={game}
                            team={team}
                            user={user}
                            {...deferredData}
                        />
                    )}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
