import { Notifications } from "@mantine/notifications";
import { Outlet } from "react-router";

import NavLinks from "@/components/NavLinks";

export default function Layout() {
    return (
        <div>
            <main>
                <Notifications />
                <Outlet />
                <NavLinks />
            </main>
        </div>
    );
}