import { Link } from "react-router";
import {
    ActionIcon,
    Avatar,
    Box,
    Group,
    Image,
    Text,
    useComputedColorScheme,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import branding from "@/constants/branding";
import useModal from "@/hooks/useModal";
import DashboardMenu from "./DashboardMenu";
import TeamSearchModal from "./TeamSearchModal";
import classes from "./MobileHeader.module.css";

const headerLogoDark = "/images/header-logo-dark.png";
const headerLogoLight = "/images/header-logo-light.png";

/**
 * MobileHeader - Permanent top navigation bar for the Mobile Dashboard, featuring
 * user avatar on the left, centered RostrHQ branding, and search/menu actions on the right.
 *
 * @param {Object} props
 * @param {Object} props.user - The logged in user object
 * @param {Array} [props.teamList=[]] - List of teams
 * @param {Function} [props.onSelectTeam] - Handler to select/switch active team
 * @param {string} [props.userId] - Current user ID
 * @returns {JSX.Element}
 */
export default function MobileHeader({
    user,
    teamList = [],
    onSelectTeam,
    userId,
}) {
    const { openModal, closeAllModals } = useModal();
    const computedColorScheme = useComputedColorScheme("dark", {
        getInitialValueInEffect: true,
    });

    const headerLogo =
        computedColorScheme === "dark" ? headerLogoDark : headerLogoLight;

    const handleOpenTeamSearch = () => {
        openModal({
            title: (
                <Text fw={700} size="lg" c="#CCFF00">
                    Find Team
                </Text>
            ),
            transitionProps: { duration: 0 },
            children: (
                <TeamSearchModal
                    teamList={teamList}
                    onSelectTeam={(teamId) => {
                        if (onSelectTeam) onSelectTeam(teamId);
                        closeAllModals();
                    }}
                />
            ),
        });
    };

    return (
        /* Top Navigation Bar (52px height) */
        <Box className={classes.stickyBar}>
            {/* Left: User Avatar Linking to Profile */}
            <Link
                to={user?.$id ? `/user/${user.$id}` : "/settings"}
                className={classes.avatarLink}
                aria-label="User Profile"
            >
                <Box
                    pos="relative"
                    w={38}
                    h={38}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div className={classes.avatarRingSmall} />
                    <Avatar
                        src={user?.prefs?.avatarUrl}
                        name={user?.name || "User"}
                        color="lime"
                        size={38}
                        radius="100%"
                    />
                </Box>
            </Link>

            {/* Center: RostrHQ Branding */}
            <Link
                to="/dashboard"
                className={classes.brandLogoWrap}
                aria-label={branding.name}
            >
                <Image
                    src={headerLogo}
                    alt={branding.name}
                    h={33}
                    w="auto"
                    fit="contain"
                />
            </Link>

            {/* Right: Search & Menu Actions */}
            <Group gap={6} style={{ zIndex: 105 }}>
                <ActionIcon
                    variant="default"
                    radius="xl"
                    size="lg"
                    onClick={handleOpenTeamSearch}
                    aria-label="Search teams"
                >
                    <IconSearch size={20} />
                </ActionIcon>

                <DashboardMenu userId={userId} />
            </Group>
        </Box>
    );
}
