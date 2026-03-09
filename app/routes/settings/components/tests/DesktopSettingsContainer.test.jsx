import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";

import DesktopSettingsContainer from "../DesktopSettingsContainer";

const mockTeams = [
    {
        $id: "team1",
        name: "Test Team 1",
    },
];

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: () => ({
        user: {
            $id: "user-123",
            email: "test@example.com",
            name: "Test User",
        },
        isDesktop: true,
    }),
}));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        openModal: jest.fn(),
        closeAllModals: jest.fn(),
    }),
}));

jest.mock("@/context/NotificationsContext", () => ({
    useNotifications: () => ({
        token: "fake-token",
        isSupported: true,
        permission: "granted",
        isSubscribedToTeam: jest.fn(),
        subscribeToTeamInfo: jest.fn(),
        unsubscribeFromTeamInfo: jest.fn(),
    }),
}));

describe("DesktopSettingsContainer", () => {
    it("renders the vertical tabs correctly", () => {
        render(
            <MemoryRouter>
                <DesktopSettingsContainer teams={mockTeams} />
            </MemoryRouter>,
        );

        expect(
            screen.getByTestId("desktop-settings-container"),
        ).toBeInTheDocument();

        // Tab list items
        expect(
            screen.getByRole("tab", { name: /Account/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: /Login Options/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: /Notifications/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: /Support/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: /Policies & Agreements/i }),
        ).toBeInTheDocument();
    });
});
