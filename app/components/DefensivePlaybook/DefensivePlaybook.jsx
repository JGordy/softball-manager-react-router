import { useState, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { Container, Stack, Title, Text, Group } from "@mantine/core";
import { IconShield, IconShieldCheck } from "@tabler/icons-react";

import DefensiveField from "./DefensiveField";
import RoleLegend from "./RoleLegend";
import PlayTimelineControls from "./PlayTimelineControls";
import PlaySelector from "./PlaySelector";
import SituationOverview from "./SituationOverview";
import DrawerContainer from "@/components/DrawerContainer";
import styles from "./DefensivePlaybook.module.css";

/**
 * DefensivePlaybook Main Component
 *
 * Full-featured slow-pitch softball defensive playbook engine.
 * Renders a clean visual-first layout:
 * 1. Centered Page Header with icon and vertical margins
 * 2. Situation sentence and mini diamond
 * 3. Animated softball field diamond (with interactive fielder nodes)
 * 4. Scrubber & playback controls
 * 5. Floating action button to open situation / scenario configuration drawer
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.plays - Complete list of defensive playbook scenarios
 * @param {Array<string>} [props.categories=[]] - List of playbook categories
 * @returns {JSX.Element}
 */
function DefensivePlaybook({ plays = [], categories = [] }) {
    const [selectedPlayId, setSelectedPlayId] = useState(plays[0]?.id || "");
    const [timelineStep, setTimelineStep] = useState(0.0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [selectedFielderId, setSelectedFielderId] = useState(null);
    const [showVectors, setShowVectors] = useState(true);

    // Scenario picker drawer state
    const [playDrawerOpened, setPlayDrawerOpened] = useState(false);

    // Active selected play & configured outs
    const [customOuts, setCustomOuts] = useState(null);

    const activePlay = useMemo(() => {
        const base =
            plays.find((p) => p.id === selectedPlayId) || plays[0] || null;
        if (!base) return null;
        if (customOuts !== null) {
            return {
                ...base,
                situation: {
                    ...base.situation,
                    outs: customOuts,
                },
            };
        }
        return base;
    }, [plays, selectedPlayId, customOuts]);

    // Handle changing play: reset timeline and pause playback
    const handleSelectPlay = (playId, outsOverride = null) => {
        setSelectedPlayId(playId);
        setCustomOuts(outsOverride !== null ? outsOverride : null);
        setTimelineStep(0.0);
        setIsPlaying(false);
        setSelectedFielderId(null);
    };

    return (
        <Container size="md" className={styles.container}>
            <Stack gap="xs" align="stretch">
                {/* 1. Centered Page Header with icon and vertical margins */}
                <Group justify="center" align="center" gap="xs" my="md">
                    <IconShieldCheck size={28} color="#CCFF33" stroke={2.2} />
                    <Title order={2} fw={800} c="white">
                        Defensive Playbook
                    </Title>
                </Group>

                {/* 2. Cohesive Tactical Situation Scoreboard */}
                <SituationOverview
                    play={activePlay}
                    onOpenSelector={() => setPlayDrawerOpened(true)}
                />

                {/* 3. The Animated Field */}
                <DefensiveField
                    play={activePlay}
                    timelineStep={timelineStep}
                    selectedFielderId={selectedFielderId}
                    onSelectFielder={setSelectedFielderId}
                    showVectors={showVectors}
                />

                {/* 4. Role Color Legend (Above controls, below field) */}
                <RoleLegend />

                {/* 5. Controls directly below the field */}
                <PlayTimelineControls
                    timelineStep={timelineStep}
                    setTimelineStep={setTimelineStep}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    playbackSpeed={playbackSpeed}
                    setPlaybackSpeed={setPlaybackSpeed}
                    ballTimeline={activePlay?.ballTimeline || []}
                    showVectors={showVectors}
                    setShowVectors={setShowVectors}
                />

                {/* Drawer: Scenario Configuration & Picker (using shared DrawerContainer) */}
                <DrawerContainer
                    opened={playDrawerOpened}
                    onClose={() => setPlayDrawerOpened(false)}
                    title={
                        <Group gap="xs">
                            <IconShield size={20} color="#CCFF33" />
                            <Text fw={700} c="white">
                                Select Play / Scenario
                            </Text>
                        </Group>
                    }
                >
                    <PlaySelector
                        plays={plays}
                        selectedPlayId={selectedPlayId}
                        onSelectPlay={(playId, outsVal) => {
                            handleSelectPlay(playId, outsVal);
                            setPlayDrawerOpened(false);
                        }}
                        categories={categories}
                    />
                </DrawerContainer>
            </Stack>
        </Container>
    );
}

DefensivePlaybook.propTypes = {
    plays: PropTypes.arrayOf(PropTypes.object).isRequired,
    categories: PropTypes.arrayOf(PropTypes.string),
};

export default memo(DefensivePlaybook);
