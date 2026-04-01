import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";

import MobileSettingsContainer from "../MobileSettingsContainer";

const mockTeams = [
    {
        $id: "team1",
        name: "Test Team 1",
    },
];

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: () => ({ state: "idle" }),
    useOutletContext: () => ({
        user: {
            $id: "user-123",
            email: "test@example.com",
            name: "Test User",
        },
        isDesktop: false,
    }),
    useFetcher: () => ({
        submit: jest.fn(),
        data: null,
        state: "idle",
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

describe("MobileSettingsContainer", () => {
    it("renders the accordion correctly", () => {
        render(
            <MemoryRouter>
                <MobileSettingsContainer teams={mockTeams} />
            </MemoryRouter>,
        );

        expect(
            screen.getByTestId("mobile-settings-container"),
        ).toBeInTheDocument();
        expect(screen.getByText("Account")).toBeInTheDocument();
        expect(screen.getByText("Login Options")).toBeInTheDocument();
        expect(screen.getByText("Notifications")).toBeInTheDocument();
        expect(screen.getByText("Support")).toBeInTheDocument();
        expect(screen.getByText("Policies & Agreements")).toBeInTheDocument();
    });
});
