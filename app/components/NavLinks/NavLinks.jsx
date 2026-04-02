import { NavLink } from "react-router";
import {
    IconBallBaseball,
    IconCalendar,
    IconSettings,
    IconUserSquareRounded,
    IconShieldLock,
} from "@tabler/icons-react";

import classes from "./NavLinks.module.css";

function NavLinks({ user }) {
    const isAdmin = user?.labels?.includes("admin");

    const links = [
        {
            label: "Home",
            icon: IconBallBaseball,
            path: "/dashboard",
        },
        {
            label: "Events",
            icon: IconCalendar,
            path: "/events",
        },
        {
            label: "Profile",
            icon: IconUserSquareRounded,
            path: `/user/${user?.$id}`,
        },
        ...(isAdmin
            ? [
                  {
                      label: "Admin",
                      icon: IconShieldLock,
                      path: "/admin",
                  },
              ]
            : []),
        {
            label: "Settings",
            icon: IconSettings,
            path: "/settings",
        },
    ];

    return (
        <nav className={classes.navLinksContainer}>
            <div className={classes.navLinks}>
                {links.map((link) => {
                    const Icon = link.icon;

                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.path === "/dashboard"}
                            className={({ isActive }) =>
                                `${classes.navLink} ${isActive ? classes.active : ""}`
                            }
                            aria-label={link.label}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={classes.iconWrapper}>
                                        <Icon
                                            size={24}
                                            stroke={isActive ? 2.5 : 1.5}
                                        />
                                    </div>
                                    <span className={classes.linkLabel}>
                                        {link.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}

export default NavLinks;
