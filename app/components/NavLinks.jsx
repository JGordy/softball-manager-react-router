import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

import { Center, SegmentedControl } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import {
    IconBallBaseball,
    IconCalendar,
    // IconHome,
    IconSettings,
    IconUserSquareRounded,
    IconShieldLock,
} from "@tabler/icons-react";

import classes from "@/styles/navlinks.module.css";

function Label({ Icon, text }) {
    return (
        <Center style={{ gap: 10 }}>
            <Icon size={24} />
            <span>{text}</span>
        </Center>
    );
}

function NavLinks({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktop = useMediaQuery("(min-width: 48em)");

    const getInitialValue = () => {
        if (location.pathname.toLowerCase().includes("user")) {
            return "user";
        }

        if (location.pathname.toLowerCase().includes("events")) {
            return "events";
        }

        if (location.pathname.toLowerCase().includes("settings")) {
            return "settings";
        }

        if (location.pathname.toLowerCase().includes("admin")) {
            return "admin";
        }

        return "dashboard";
    };

    const [value, setValue] = useState(getInitialValue());

    const isAdmin = user?.labels?.includes("admin");

    const links = [
        {
            label: (
                <Label
                    Icon={IconBallBaseball}
                    text={(isDesktop || value === "dashboard") && "Home"}
                />
            ),
            value: "dashboard",
        },
        {
            label: (
                <Label
                    Icon={IconCalendar}
                    text={(isDesktop || value === "events") && "Events"}
                />
            ),
            value: "events",
        },
        {
            label: (
                <Label
                    Icon={IconUserSquareRounded}
                    text={(isDesktop || value === "user") && "Profile"}
                />
            ),
            value: "user",
        },
        ...(isAdmin
            ? [
                  {
                      label: (
                          <Label
                              Icon={IconShieldLock}
                              text={(isDesktop || value === "admin") && "Admin"}
                          />
                      ),
                      value: "admin",
                  },
              ]
            : []),
        {
            label: (
                <Label
                    Icon={IconSettings}
                    text={(isDesktop || value === "settings") && "Settings"}
                />
            ),
            value: "settings",
        },
    ];

    useEffect(() => {
        setValue(getInitialValue()); // Update value when location changes
    }, [location]);

    const handleNavLinkClick = (newValue) => {
        setValue(newValue);

        if (newValue === "user") {
            navigate(`/user/${user?.$id}`);
        } else if (newValue === "dashboard") {
            navigate("/dashboard");
        } else {
            navigate(`/${newValue}`);
        }
    };

    return (
        <div className={classes.navLinksContainer}>
            <SegmentedControl
                className={classes.navLinks}
                color="lime.4"
                data={links}
                fullWidth={!isDesktop}
                onChange={handleNavLinkClick}
                size="lg"
                radius="xl"
                value={value}
                transitionDuration={500}
                transitionTimingFunction="linear"
                withItemsBorders={false}
            />
        </div>
    );
}

export default NavLinks;
