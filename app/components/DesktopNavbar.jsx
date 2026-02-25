import { useLocation, useNavigate } from "react-router";
import { Group, Image, UnstyledButton, Text, Title } from "@mantine/core";
import {
    IconBallBaseball,
    IconCalendar,
    IconSettings,
    IconUserSquareRounded,
    IconShieldLock,
} from "@tabler/icons-react";

import classes from "@/styles/desktopNavbar.module.css";
import branding from "@/constants/branding";
import images from "@/constants/images";

const { brandIcon192 } = images;

function NavbarLink({ icon: Icon, label, active, onClick }) {
    return (
        <UnstyledButton
            onClick={onClick}
            className={classes.link}
            data-active={active || undefined}
        >
            <Group gap="xs">
                <Icon size={20} stroke={1.5} />
                <Text fw={500} size="sm">
                    {label}
                </Text>
            </Group>
        </UnstyledButton>
    );
}

const defaultLinks = [
    { icon: IconBallBaseball, label: "Home", value: "dashboard" },
    { icon: IconCalendar, label: "Events", value: "events" },
    { icon: IconUserSquareRounded, label: "Profile", value: "user" },
    { icon: IconSettings, label: "Settings", value: "settings" },
];

export default function DesktopNavbar({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    const getInitialValue = () => {
        if (location.pathname.toLowerCase().includes("user")) return "user";
        if (location.pathname.toLowerCase().includes("events")) return "events";
        if (location.pathname.toLowerCase().includes("settings"))
            return "settings";
        if (location.pathname.toLowerCase().includes("admin")) return "admin";
        return "dashboard";
    };

    const activeValue = getInitialValue();
    const isAdmin = user?.labels?.includes("admin");

    const links = [
        ...defaultLinks.slice(0, 3),
        ...(isAdmin
            ? [{ icon: IconShieldLock, label: "Admin", value: "admin" }]
            : []),
        ...defaultLinks.slice(3),
    ];

    const handleNavigate = (value) => {
        if (value === "user") {
            navigate(`/user/${user?.$id}`);
        } else if (value === "dashboard") {
            navigate("/dashboard");
        } else {
            navigate(`/${value}`);
        }
    };

    const items = links.map((link) => (
        <NavbarLink
            {...link}
            key={link.label}
            active={link.value === activeValue}
            onClick={() => handleNavigate(link.value)}
        />
    ));

    return (
        <header className={classes.header}>
            <Group justify="space-between" h="100%" px="md">
                <Group gap="xs">
                    <div style={{ width: 32, height: 32 }}>
                        <Image src={brandIcon192} alt={branding.name} />
                    </div>
                    <Title order={3}>{branding.name}</Title>
                </Group>

                <Group gap="sm">{items}</Group>
            </Group>
        </header>
    );
}
