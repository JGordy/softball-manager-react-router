import { NavLink } from "react-router";
import {
    IconCalendar,
    IconSettings,
    IconUserSquareRounded,
    IconShieldLock,
} from "@tabler/icons-react";

import classes from "./NavLinks.module.css";

function HomePlateIcon({ size = 24, active }) {
    return (
        <img
            src="/images/home-plate-icon.png"
            alt="Home"
            width={size}
            height={size}
            style={{
                objectFit: "contain",
                display: "block",
                filter: active
                    ? "drop-shadow(0 0 4px rgba(204, 255, 51, 0.6))"
                    : "opacity(0.85)",
                transition: "filter 0.2s ease, transform 0.2s ease",
                transform: active ? "scale(1.1)" : "scale(1)",
            }}
        />
    );
}

function NavLinks({ user }) {
    const isAdmin = user?.labels?.includes("admin");

    const links = [
        {
            label: "Home",
            icon: HomePlateIcon,
            path: "/dashboard",
            isCustomIcon: true,
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
                                        {link.isCustomIcon ? (
                                            <Icon size={24} active={isActive} />
                                        ) : (
                                            <Icon
                                                size={24}
                                                stroke={isActive ? 2.5 : 1.5}
                                            />
                                        )}
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
