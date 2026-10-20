import { useState } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Group,
    Radio,
    SegmentedControl,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { IconMailFast, IconPlus } from "@tabler/icons-react";
import { useNavigation } from "react-router";
import FormWrapper from "@/forms/FormWrapper";
import ConvertGuestModal from "@/forms/ConvertGuestModal";

/**
 * Modal for adding a guest player to a game lineup.
 * Allows choosing from previous guests who have subbed before (reusing their record or converting them)
 * or creating a new temporary guest player.
 *
 * @param {object} props
 * @param {string} props.teamId - ID of the team.
 * @param {string} props.eventId - ID of the game event.
 * @param {string} props.actionRoute - Route to submit actions to.
 * @param {Array<object>} [props.guestPlayers] - List of previous guest players for this team.
 * @param {Array<object>} [props.currentLineup] - Current active lineup slots to filter out players already added.
 */
export default function AddGuestPlayerModal({
    teamId,
    eventId,
    actionRoute,
    guestPlayers = [],
    currentLineup = [],
}) {
    const navigation = useNavigation();
    const isSubmitting =
        navigation.state !== "idle" &&
        navigation.formData?.get("_action") === "create-guest-player";

    // Filter out guests who are already in the current lineup
    const lineupPlayerIds = new Set(
        (currentLineup || []).map((slot) => slot?.$id).filter(Boolean),
    );
    const availableGuests = guestPlayers.filter(
        (g) => !lineupPlayerIds.has(g.$id),
    );

    const hasPreviousGuests = availableGuests.length > 0;
    const [selectedTab, setSelectedTab] = useState(
        hasPreviousGuests ? "previous" : "new",
    );
    const [convertingGuest, setConvertingGuest] = useState(null);

    // If currently converting a guest, show the ConvertGuestModal
    if (convertingGuest) {
        return (
            <Stack gap="md">
                <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => setConvertingGuest(null)}
                    style={{ alignSelf: "flex-start" }}
                >
                    ← Back to guest list
                </Button>
                <ConvertGuestModal
                    guestPlayer={convertingGuest}
                    teamId={teamId}
                    actionRoute={actionRoute}
                />
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            {hasPreviousGuests && (
                <SegmentedControl
                    value={selectedTab}
                    onChange={setSelectedTab}
                    data={[
                        { label: "Previous Guests", value: "previous" },
                        { label: "New Guest", value: "new" },
                    ]}
                    fullWidth
                    size="sm"
                />
            )}

            {hasPreviousGuests && selectedTab === "previous" ? (
                <Stack gap="sm">
                    <Text size="sm" c="dimmed">
                        Select a former guest player to reuse in this lineup, or
                        convert them to a full team member with an email invite:
                    </Text>

                    <Stack gap="xs" mt="xs">
                        {availableGuests.map((guest) => {
                            const fullName =
                                `${guest.firstName} ${guest.lastName}`.trim();
                            const isAddingThisGuest =
                                navigation.state !== "idle" &&
                                navigation.formData?.get("_action") ===
                                    "add-existing-guest" &&
                                navigation.formData?.get("guestPlayerId") ===
                                    guest.$id;

                            return (
                                <Card
                                    key={guest.$id}
                                    withBorder
                                    radius="md"
                                    p="sm"
                                >
                                    <Group
                                        justify="space-between"
                                        wrap="nowrap"
                                    >
                                        <Group
                                            gap="sm"
                                            wrap="nowrap"
                                            style={{ minWidth: 0 }}
                                        >
                                            <Avatar
                                                color="initials"
                                                name={fullName}
                                                radius="xl"
                                                size="sm"
                                            />
                                            <div style={{ minWidth: 0 }}>
                                                <Group gap="xs" wrap="nowrap">
                                                    <Text
                                                        fz="sm"
                                                        fw={600}
                                                        truncate
                                                    >
                                                        {fullName}
                                                    </Text>
                                                    <Badge
                                                        size="xs"
                                                        color="gray"
                                                        variant="light"
                                                    >
                                                        {guest.gender}
                                                    </Badge>
                                                </Group>
                                                <Text fz="xs" c="dimmed">
                                                    {guest.gameCount}{" "}
                                                    {guest.gameCount === 1
                                                        ? "game"
                                                        : "games"}{" "}
                                                    played
                                                </Text>
                                            </div>
                                        </Group>

                                        <Group gap="xs" wrap="nowrap">
                                            <form
                                                method="post"
                                                action={actionRoute}
                                            >
                                                <input
                                                    type="hidden"
                                                    name="_action"
                                                    value="add-existing-guest"
                                                />
                                                <input
                                                    type="hidden"
                                                    name="guestPlayerId"
                                                    value={guest.$id}
                                                />
                                                <input
                                                    type="hidden"
                                                    name="firstName"
                                                    value={guest.firstName}
                                                />
                                                <input
                                                    type="hidden"
                                                    name="lastName"
                                                    value={guest.lastName}
                                                />
                                                <input
                                                    type="hidden"
                                                    name="gender"
                                                    value={guest.gender}
                                                />
                                                <Button
                                                    type="submit"
                                                    size="xs"
                                                    color="lime"
                                                    loading={isAddingThisGuest}
                                                    leftSection={
                                                        <IconPlus size={14} />
                                                    }
                                                >
                                                    Add
                                                </Button>
                                            </form>

                                            <Button
                                                size="xs"
                                                variant="outline"
                                                color="blue"
                                                leftSection={
                                                    <IconMailFast size={14} />
                                                }
                                                onClick={() =>
                                                    setConvertingGuest(guest)
                                                }
                                            >
                                                Invite
                                            </Button>
                                        </Group>
                                    </Group>
                                </Card>
                            );
                        })}
                    </Stack>
                </Stack>
            ) : (
                <FormWrapper
                    action="create-guest-player"
                    actionRoute={actionRoute}
                    confirmText="Add Guest Player"
                    loading={isSubmitting}
                >
                    <input type="hidden" name="teamId" value={teamId} />
                    <input type="hidden" name="eventId" value={eventId} />

                    <Stack gap="md">
                        <TextInput
                            label="First Name"
                            name="firstName"
                            placeholder="e.g. John"
                            required
                            radius="md"
                            size="md"
                            autoFocus
                        />
                        <TextInput
                            label="Last Name"
                            name="lastName"
                            placeholder="e.g. Smith"
                            required
                            radius="md"
                            size="md"
                        />
                        <Radio.Group
                            label="Gender"
                            name="gender"
                            required
                            defaultValue="Male"
                            size="md"
                        >
                            <Group mt="xs">
                                <Radio value="Male" label="Male" />
                                <Radio value="Female" label="Female" />
                            </Group>
                        </Radio.Group>
                    </Stack>
                </FormWrapper>
            )}
        </Stack>
    );
}
