import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ActionIcon, Avatar, Box, Group, Text } from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import {
    IconSearch,
    IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react";

import DashboardMenu from "./DashboardMenu";
import TeamSearchModal from "./TeamSearchModal";
import classes from "./MobileHeader.module.css";

/**
 * MobileHeader - Dynamic Collapsing Sticky Header for Mobile Dashboard.
 *
 * @param {Object} props
 * @param {Object} props.user - The logged in user object
 * @param {boolean} [props.isVerified=false] - Whether user email is verified
 * @param {Object} [props.activeTeam] - Currently active team object
 * @param {Array} [props.teamList=[]] - List of teams
 * @param {Function} [props.onSelectTeam] - Handler to select/switch active team
 * @param {string} [props.userId] - Current user ID
 * @returns {JSX.Element}
 */
export default function MobileHeader({
    user,
    isVerified = false,
    activeTeam,
    teamList = [],
    onSelectTeam,
    userId,
}) {
    const [scroll] = useWindowScroll();
    const [searchOpened, setSearchOpened] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Hysteresis threshold: activate when scrolled down past 50px, deactivate when returning above 20px.
    // Fixed document flow height guarantees zero layout shift and zero jitter/thrashing loops.
    useEffect(() => {
        if (scroll.y > 50 && !isScrolled) {
            setIsScrolled(true);
        } else if (scroll.y < 20 && isScrolled) {
            setIsScrolled(false);
        }
    }, [scroll.y, isScrolled]);

    // Extract active team nickname or short name
    const teamName = activeTeam?.name || "";
    const teamNickname = teamName
        ? teamName.trim().split(" ").pop().toUpperCase()
        : "TEAMS";

    const firstName = user?.name ? user.name.split(" ")[0] : "Player";

    return (
        <>
            {/* Sticky Top Bar (Pinned at top: 0 with constant 52px height) */}
            <Box
                className={`${classes.stickyBar} ${isScrolled ? classes.scrolled : ""}`}
            >
                {/* Left: Docked Avatar (cleanly crossfades in when scrolled) */}
                <div
                    className={`${classes.dockedAvatarWrap} ${isScrolled ? classes.dockedAvatarVisible : ""}`}
                >
                    <Link
                        to={user?.$id ? `/user/${user.$id}` : "/settings"}
                        className={classes.dockedAvatarLink}
                        aria-label="User Profile Navigation"
                    >
                        <div className={classes.avatarContainerSmall}>
                            <div className={classes.avatarRingSmall} />
                            <Avatar
                                src={user?.prefs?.avatarUrl}
                                name={user?.name || "User"}
                                color="lime"
                                size={34}
                                radius="100%"
                            />
                        </div>
                    </Link>
                </div>

                {/* Center: Active Team Nickname (fades in when scrolled) */}
                <Text
                    className={`${classes.teamNameDisplay} ${isScrolled ? classes.teamNameVisible : ""}`}
                >
                    {teamNickname}
                </Text>

                {/* Right: Search & Menu Actions (always accessible) */}
                <Group gap={6} className={classes.rightActions}>
                    <ActionIcon
                        variant="subtle"
                        radius="xl"
                        size="md"
                        className={classes.actionButton}
                        onClick={() => setSearchOpened(true)}
                        aria-label="Search teams"
                    >
                        <IconSearch size={18} />
                    </ActionIcon>

                    <DashboardMenu userId={userId} />
                </Group>
            </Box>

            {/* In-flow Hero Greeting Section (stays in place, scrolls naturally with document) */}
            <Box className={classes.heroSection}>
                <Link
                    to={user?.$id ? `/user/${user.$id}` : "/settings"}
                    className={classes.heroAvatarLink}
                    aria-label="User Profile"
                >
                    <div className={classes.heroAvatarContainer}>
                        <div className={classes.heroAvatarRing} />
                        <Avatar
                            src={user?.prefs?.avatarUrl}
                            name={user?.name || "User"}
                            color="lime"
                            size={74}
                            radius="100%"
                        />
                    </div>
                </Link>

                <Group gap={6} justify="center" mt="xs">
                    <Text size="xl" fw={800} className={classes.heroGreeting}>
                        Hello, {firstName}!
                    </Text>
                    {isVerified && (
                        <IconRosetteDiscountCheckFilled
                            size={20}
                            color="#3b82f6"
                        />
                    )}
                </Group>

                <Text size="xs" c="dimmed" mt={2} ta="center">
                    Team and events summary
                </Text>
            </Box>

            {/* Quick search modal */}
            <TeamSearchModal
                opened={searchOpened}
                onClose={() => setSearchOpened(false)}
                teamList={teamList}
                onSelectTeam={onSelectTeam}
            />
        </>
    );
}
