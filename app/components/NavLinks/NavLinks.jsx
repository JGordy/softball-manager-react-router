import { useNavigate, useLocation } from "react-router";
import {
    IconBallBaseball,
    IconCalendar,
    IconSettings,
    IconUserSquareRounded,
    IconShieldLock,
} from "@tabler/icons-react";

import classes from "./NavLinks.module.css";

function NavLinks({ user, isDesktop }) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (pathname) => {
        const currentPath = location.pathname.toLowerCase();
        const targetPath = pathname.toLowerCase();

        if (targetPath === "/dashboard" && currentPath === "/dashboard")
            return true;
        if (targetPath !== "/dashboard" && currentPath.includes(targetPath))
            return true;
        return false;
    };

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

    const handleNavLinkClick = (path) => {
        navigate(path);
    };

    return (
        <nav className={classes.navLinksContainer}>
            <div className={classes.navLinks}>
                {links.map((link) => {
                    const active = isActive(link.path);
                    const Icon = link.icon;

                    return (
                        <button
                            key={link.path}
                            className={`${classes.navLink} ${active ? classes.active : ""}`}
                            onClick={() => handleNavLinkClick(link.path)}
                            aria-label={link.label}
                        >
                            <div className={classes.iconWrapper}>
                                <Icon size={24} stroke={active ? 2.5 : 1.5} />
                            </div>
                            <span className={classes.linkLabel}>
                                {link.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

export default NavLinks;
