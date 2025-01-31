import { Notifications } from "@mantine/notifications";
import { Outlet } from "react-router";

export default function Layout() {
    return (
        <div>
            <main>
                <Notifications />
                <Outlet />
            </main>
        </div>
    );
}