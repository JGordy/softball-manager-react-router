import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
    Select,
    SegmentedControl,
    Stack,
    Text,
    Box,
    Button,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

/**
 * Normalizes and extracts the primary defensive target / hit location zone
 * from a defensive play scenario.
 *
 * @param {Object} play - Defensive play object
 * @returns {string} Fielder zone identifier (e.g. "3B", "SS", "2B", "LF", etc.)
 */
export function getPlayLocation(play) {
    if (!play) return "3B";

    const title = (play.title || "").toLowerCase();
    const hitType = (play.situation?.hitType || "").toLowerCase();
    const titleBeforeHyphen = (
        title.includes(" - ")
            ? title.split(" - ")[0]
            : title.split("-")[0] || ""
    ).trim();

    // 1. Double play notation (first number is the position where the ball was fielded)
    const dpMatch = play.title.match(/([1-6])-[0-9]-[0-9]/);
    if (dpMatch) {
        const leadPos = dpMatch[1];
        if (leadPos === "5") return "3B";
        if (leadPos === "6") return "SS";
        if (leadPos === "4") return "2B";
        if (leadPos === "3") return "1B";
        if (leadPos === "2") return "C";
        if (leadPos === "1") return "P";
    }

    // 2. Specific "to [location]" in the hit part of the title (before hyphen)
    if (
        /\bto c\b/i.test(titleBeforeHyphen) ||
        titleBeforeHyphen.includes("to catcher") ||
        titleBeforeHyphen.includes("behind home") ||
        titleBeforeHyphen.includes("squeeze") ||
        titleBeforeHyphen.includes("dribbler to c")
    )
        return "C";
    if (
        titleBeforeHyphen.includes("to 3b") ||
        titleBeforeHyphen.includes("to third")
    )
        return "3B";
    if (
        titleBeforeHyphen.includes("to ss") ||
        titleBeforeHyphen.includes("to shortstop")
    )
        return "SS";
    if (
        titleBeforeHyphen.includes("to 2b") ||
        titleBeforeHyphen.includes("to second")
    )
        return "2B";
    if (
        titleBeforeHyphen.includes("to 1b") ||
        titleBeforeHyphen.includes("to first")
    )
        return "1B";
    if (
        /\bto p\b/i.test(titleBeforeHyphen) ||
        titleBeforeHyphen.includes("to pitcher") ||
        titleBeforeHyphen.includes("comebacker")
    )
        return "P";

    // Outfield hits before hyphen
    if (
        titleBeforeHyphen.includes("to rc") ||
        titleBeforeHyphen.includes("in rc") ||
        titleBeforeHyphen.includes("right-center") ||
        titleBeforeHyphen.includes("right center")
    )
        return "RC";
    if (
        titleBeforeHyphen.includes("to lc") ||
        titleBeforeHyphen.includes("in lc") ||
        titleBeforeHyphen.includes("left-center") ||
        titleBeforeHyphen.includes("left center")
    )
        return "LC";
    if (
        titleBeforeHyphen.includes("to lf") ||
        titleBeforeHyphen.includes("down lf") ||
        titleBeforeHyphen.includes("left field")
    )
        return "LF";
    if (
        titleBeforeHyphen.includes("to rf") ||
        titleBeforeHyphen.includes("down rf") ||
        titleBeforeHyphen.includes("right field")
    )
        return "RF";
    if (
        titleBeforeHyphen.includes("to center") ||
        titleBeforeHyphen.includes("dead center")
    )
        return "LC";

    // 3. Check hitType description
    if (
        /\bto c\b/i.test(hitType) ||
        hitType.includes("to catcher") ||
        hitType.includes("behind home") ||
        hitType.includes("squeeze")
    )
        return "C";
    if (hitType.includes("to 3b") || hitType.includes("to third")) return "3B";
    if (hitType.includes("to ss") || hitType.includes("to shortstop"))
        return "SS";
    if (hitType.includes("to 2b") || hitType.includes("to second")) return "2B";
    if (hitType.includes("to 1b") || hitType.includes("to first")) return "1B";
    if (
        /\bto p\b/i.test(hitType) ||
        hitType.includes("to pitcher") ||
        hitType.includes("comebacker")
    )
        return "P";
    if (
        hitType.includes("to rc") ||
        hitType.includes("in rc") ||
        hitType.includes("right-center") ||
        hitType.includes("right center")
    )
        return "RC";
    if (
        hitType.includes("to lc") ||
        hitType.includes("in lc") ||
        hitType.includes("left-center") ||
        hitType.includes("left center")
    )
        return "LC";
    if (
        hitType.includes("to lf") ||
        hitType.includes("down lf") ||
        hitType.includes("left field")
    )
        return "LF";
    if (
        hitType.includes("to rf") ||
        hitType.includes("down rf") ||
        hitType.includes("right field")
    )
        return "RF";
    if (hitType.includes("to center") || hitType.includes("dead center"))
        return "LC";

    // 4. Coordinates of where ball is fielded from ballTimeline[1]
    if (play.ballTimeline && play.ballTimeline[1] && play.ballTimeline[1].pos) {
        const { x, y } = play.ballTimeline[1].pos;
        if (x <= 30) return "LF";
        if (x >= 70) return "RF";
        if (y <= 36 && x < 50) return "LC";
        if (y <= 36 && x >= 50) return "RC";
        if (y >= 74 && x >= 44 && x <= 56) return "C";
        if (y >= 58 && y < 74 && x >= 44 && x <= 56) return "P";
        if (x <= 38) return "3B";
        if (x >= 62) return "1B";
        if (x < 50) return "SS";
        if (x >= 50) return "2B";
    }

    return "3B";
}

/**
 * Resolves the explicit base runner state for a play based on its runner positions.
 *
 * @param {Object} play - Defensive play object
 * @returns {string} Standard base state label
 */
export function getPlayBaseState(play) {
    if (!play) return "Bases Empty";
    const runners = (play.situation?.runners || [])
        .map((r) => {
            if (r === 1 || r === "1" || r === "1B") return "1B";
            if (r === 2 || r === "2" || r === "2B") return "2B";
            if (r === 3 || r === "3" || r === "3B") return "3B";
            return String(r);
        })
        .sort()
        .join(",");

    if (!runners) return "Bases Empty";
    if (runners === "1B") return "Runner on 1st";
    if (runners === "2B") return "Runner on 2nd";
    if (runners === "3B") return "Runner on 3rd";
    if (runners === "1B,2B") return "Runners on 1st & 2nd";
    if (runners === "1B,3B") return "First & Third";
    if (runners === "2B,3B") return "Second & Third";
    if (runners === "1B,2B,3B") return "Bases Loaded";
    return play.category || "Bases Empty";
}

export const BASE_STATE_OPTIONS = [
    { label: "Bases Empty", value: "Bases Empty" },
    { label: "Runner on 1st", value: "Runner on 1st" },
    { label: "Runner on 2nd", value: "Runner on 2nd" },
    { label: "Runner on 3rd", value: "Runner on 3rd" },
    { label: "Runners on 1st & 2nd", value: "Runners on 1st & 2nd" },
    { label: "First & Third (1B & 3B)", value: "First & Third" },
    { label: "Second & Third (2B & 3B)", value: "Second & Third" },
    { label: "Bases Loaded", value: "Bases Loaded" },
];

const OUT_OPTIONS = [
    { label: "0 Outs", value: "0" },
    { label: "1 Out", value: "1" },
    { label: "2 Outs", value: "2" },
];

const BATTER_OPTIONS = [
    { label: "Righty (RHH)", value: "R" },
    { label: "Lefty (LHH)", value: "L" },
];

/**
 * PlaySelector Component
 *
 * Configurable situation picker allowing users to configure game parameters:
 * Base state, Out state, Hit type, Location/Fielder, and Batter stance,
 * dynamically selecting and previewing the matching tactical scenario.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.plays - All available defensive play scenarios
 * @param {string} props.selectedPlayId - ID of currently selected play
 * @param {Function} props.onSelectPlay - Callback when a play is chosen
 * @param {Array<string>} [props.categories=[]] - Category list
 * @returns {JSX.Element}
 */
export default function PlaySelector({
    plays = [],
    selectedPlayId,
    onSelectPlay = () => {},
    categories: _categories = [],
}) {
    const activePlay = useMemo(() => {
        return plays.find((p) => p.id === selectedPlayId) || plays[0] || null;
    }, [plays, selectedPlayId]);

    // Scenario input states (initialized from activePlay)
    const [baseState, setBaseState] = useState(getPlayBaseState(activePlay));
    const [outs, setOuts] = useState(String(activePlay?.situation?.outs ?? 0));
    const [hitType, setHitType] = useState(
        activePlay?.subCategory || "Infield Grounder",
    );
    const [hitLocation, setHitLocation] = useState(getPlayLocation(activePlay));
    const [batterHand, setBatterHand] = useState(
        activePlay?.situation?.batterHand || "R",
    );

    // Sync input states ONLY if the active play on the field changes externally (different ID)
    useEffect(() => {
        if (activePlay && activePlay.id === selectedPlayId) {
            setBaseState(getPlayBaseState(activePlay));
            setOuts(String(activePlay.situation?.outs ?? 0));
            setHitType(activePlay.subCategory);
            setHitLocation(getPlayLocation(activePlay));
            setBatterHand(activePlay.situation?.batterHand || "R");
        }
    }, [selectedPlayId, activePlay]);

    // Dynamic hit type options available for selected base state
    const hitTypeOptions = useMemo(() => {
        const availableInCat = plays
            .filter((p) => getPlayBaseState(p) === baseState)
            .map((p) => p.subCategory);
        const unique = [...new Set(availableInCat)];
        if (unique.length === 0) {
            return [
                { label: "Infield Grounder", value: "Infield Grounder" },
                { label: "Base Hit", value: "Base Hit" },
                { label: "Extra Bases", value: "Extra Bases" },
                { label: "Double Play", value: "Double Play" },
                { label: "Fly Ball / Tag", value: "Fly Ball / Tag" },
            ];
        }
        return unique.map((t) => ({ label: t, value: t }));
    }, [plays, baseState]);

    // Dynamic hit location options based on hitType
    const locationOptions = useMemo(() => {
        const isGrounderOrDP =
            hitType === "Infield Grounder" || hitType === "Double Play";
        if (isGrounderOrDP) {
            return [
                { label: "Third Base (3B)", value: "3B" },
                { label: "Shortstop (SS)", value: "SS" },
                { label: "Second Base (2B)", value: "2B" },
                { label: "First Base (1B)", value: "1B" },
                { label: "Pitcher (P)", value: "P" },
                { label: "Catcher (C)", value: "C" },
            ];
        }
        return [
            { label: "Left Field (LF)", value: "LF" },
            { label: "Left Center (LC)", value: "LC" },
            { label: "Right Center (RC)", value: "RC" },
            { label: "Right Field (RF)", value: "RF" },
        ];
    }, [hitType]);

    // Synchronous change handlers that prevent cascading race conditions
    const handleBaseStateChange = (newBase) => {
        if (!newBase) return;
        setBaseState(newBase);

        const availableInCat = plays
            .filter((p) => getPlayBaseState(p) === newBase)
            .map((p) => p.subCategory);
        const unique = [...new Set(availableInCat)];
        if (unique.length > 0 && !unique.includes(hitType)) {
            const nextType = unique[0];
            setHitType(nextType);
            const isGrounder =
                nextType === "Infield Grounder" || nextType === "Double Play";
            const validLocs = isGrounder
                ? ["3B", "SS", "2B", "1B", "P", "C"]
                : ["LF", "LC", "RC", "RF"];
            if (!validLocs.includes(hitLocation)) {
                setHitLocation(validLocs[0]);
            }
        }
    };

    const handleHitTypeChange = (newType) => {
        if (!newType) return;
        setHitType(newType);

        const isGrounder =
            newType === "Infield Grounder" || newType === "Double Play";
        const validLocs = isGrounder
            ? ["3B", "SS", "2B", "1B", "P", "C"]
            : ["LF", "LC", "RC", "RF"];
        if (!validLocs.includes(hitLocation)) {
            setHitLocation(validLocs[0]);
        }
    };

    const handleHitLocationChange = (newLoc) => {
        if (!newLoc) return;
        setHitLocation(newLoc);
    };

    const handleOutsChange = (newOuts) => {
        setOuts(newOuts);
    };

    const handleBatterHandChange = (newHand) => {
        setBatterHand(newHand);
    };

    // Matching engine: Weighted scoring prioritizing Hit Location and Base State
    const matchedPlay = useMemo(() => {
        if (!plays || plays.length === 0) {
            return null;
        }

        const outNum = parseInt(outs, 10);

        // Score all plays based on alignment with selected inputs
        const scoredPlays = plays.map((p) => {
            let score = 0;
            const pLoc = getPlayLocation(p);

            // 1. Base state match (using exact runner configuration)
            if (getPlayBaseState(p) === baseState) {
                score += 1000;
            }

            // 2. Hit Location (primary tactical selection: 3B, SS, 2B, 1B, P, LF, etc.)
            if (pLoc === hitLocation) {
                score += 500;
            }

            // 3. SubCategory (Infield Grounder vs Double Play vs Base Hit vs Fly Ball)
            if (p.subCategory === hitType) {
                score += 200;
            } else if (
                (hitType === "Infield Grounder" &&
                    p.subCategory === "Double Play") ||
                (hitType === "Double Play" &&
                    p.subCategory === "Infield Grounder")
            ) {
                score += 100;
            }

            // 4. Exact outs match
            if (p.situation?.outs === outNum) {
                score += 50;
            }

            // 5. Batter Hand match
            if (p.situation?.batterHand === batterHand) {
                score += 10;
            }

            return { play: p, score };
        });

        // Sort descending by score
        scoredPlays.sort((a, b) => b.score - a.score);

        return scoredPlays[0]?.play || plays[0];
    }, [plays, baseState, outs, hitType, hitLocation, batterHand]);

    return (
        <Stack gap="md" p="xs">
            {/* 1. Base State / Runners */}
            <Box>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                    Base State (Runners)
                </Text>
                <Select
                    data={BASE_STATE_OPTIONS}
                    value={baseState}
                    onChange={handleBaseStateChange}
                    checkIconPosition="right"
                    comboboxProps={{ zIndex: 10000 }}
                    aria-label="Base state selector"
                />
            </Box>

            {/* 2. Outs */}
            <Box>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                    Outs
                </Text>
                <SegmentedControl
                    data={OUT_OPTIONS}
                    value={outs}
                    onChange={handleOutsChange}
                    fullWidth
                    color="orange"
                    aria-label="Outs selector"
                />
            </Box>

            {/* 3. Hit Type */}
            <Box>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                    Hit Type
                </Text>
                <Select
                    data={hitTypeOptions}
                    value={hitType}
                    onChange={handleHitTypeChange}
                    checkIconPosition="right"
                    comboboxProps={{ zIndex: 10000 }}
                    aria-label="Hit type selector"
                />
            </Box>

            {/* 4. Hit Direction / Location */}
            <Box>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                    Hit Direction / Target Zone
                </Text>
                <Select
                    data={locationOptions}
                    value={hitLocation}
                    onChange={handleHitLocationChange}
                    checkIconPosition="right"
                    comboboxProps={{ zIndex: 10000 }}
                    aria-label="Hit location selector"
                />
            </Box>

            {/* 5. Batter Stance */}
            <Box>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                    Batter Stance
                </Text>
                <SegmentedControl
                    data={BATTER_OPTIONS}
                    value={batterHand}
                    onChange={handleBatterHandChange}
                    fullWidth
                    color="gray"
                    aria-label="Batter stance selector"
                />
            </Box>

            {/* Matched Scenario Confirm CTA */}
            {matchedPlay && (
                <Box mt="xs">
                    <Text size="sm" fw={700} c="white" mb="xs" ta="center">
                        {matchedPlay.title}
                    </Text>
                    <Button
                        fullWidth
                        color="lime"
                        c="#111827"
                        fw={700}
                        radius="md"
                        size="md"
                        leftSection={<IconCheck size={20} />}
                        onClick={() =>
                            onSelectPlay(matchedPlay.id, parseInt(outs, 10))
                        }
                        aria-label="Select matched scenario"
                    >
                        {matchedPlay.id === selectedPlayId
                            ? "Active Scenario"
                            : "Display Scenario"}
                    </Button>
                </Box>
            )}
        </Stack>
    );
}

PlaySelector.propTypes = {
    plays: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedPlayId: PropTypes.string,
    onSelectPlay: PropTypes.func,
    categories: PropTypes.arrayOf(PropTypes.string),
};
